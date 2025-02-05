export class TwitchChatService {
	private socket!: WebSocket
	private chatMessages: string[] = []
	private username: string
	private token: string
	private channel: string
	private reconnectInterval: number = 5000 // 5 seconds

	constructor(username: string, channel: string) {
		this.username = username
		this.token = process.env.TWITCH_OAUTH_TOKEN || ''
		this.channel = channel
		this.connect()
	}

	private connect() {
		console.log('Connecting to Twitch chat...')
		this.socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443')

		this.socket.onopen = () => {
			console.log('WebSocket connection opened')
			this.socket.send(`PASS oauth:${this.token}`)
			this.socket.send(`NICK ${this.username}`)
			this.socket.send(`JOIN #${this.channel}`)
		}

		this.socket.onmessage = (event) => {
			const message = event.data
			console.log('Received message:', message)
			if (message.includes('PRIVMSG')) {
				const chatMessage = this.parseMessage(message)
				if (chatMessage) {
					this.chatMessages.push(chatMessage)
					console.log('Parsed chat message:', chatMessage)
				}
			}
		}

		this.socket.onerror = (error) => {
			console.error('WebSocket error:', error)
			this.reconnect()
		}

		this.socket.onclose = () => {
			console.log('WebSocket connection closed')
			this.reconnect()
		}
	}

	private reconnect() {
		console.log(
			`Reconnecting in ${this.reconnectInterval / 1000} seconds...`
		)
		setTimeout(() => {
			this.connect()
		}, this.reconnectInterval)
	}

	private parseMessage(message: string): string | null {
		const match = message.match(
			/:(.*)!.*@.*\.tmi\.twitch\.tv PRIVMSG #.* :(.*)/
		)
		return match ? `${match[1]}: ${match[2]}` : null
	}

	public getChatMessages(): string[] {
		return this.chatMessages
	}

	public changeStreamer(streamer: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.socket && this.socket.readyState === WebSocket.OPEN) {
				console.log(`Leaving channel: ${this.channel}`)
				this.socket.send(`PART #${this.channel}`)
				this.channel = streamer
				this.socket.send(`JOIN #${this.channel}`)
				this.chatMessages = []
				resolve()
			} else {
				console.error(
					'WebSocket is not open. Cannot change streamer.'
				)
				reject(new Error('WebSocket is not open.'))
			}
		})
	}

	public getChannel(): string {
		return this.channel
	}

	public sendMessage(message: string) {
		if (this.socket && this.socket.readyState === WebSocket.OPEN) {
			this.socket.send(`PRIVMSG #${this.channel} :${message}`)
			console.log('Sent message:', message)
		} else {
			console.error('WebSocket is not open. Cannot send message.')
		}
	}
}
