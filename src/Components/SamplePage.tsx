import {
	GamepadUiView,
	RequiredProps,
	TextArea, // TODO find a new component from the efb api, this one is for a large text entry area
	TTButton,
	TVNode,
	UiViewProps,
} from '@efb/efb-api'
import { FSComponent } from '@microsoft/msfs-sdk'
import { TwitchChatService } from '../Components/TwitchChatService'
import './SamplePage.scss'

interface SamplePageProps extends RequiredProps<UiViewProps, 'appViewService'> {
	/** The page title */
	title: string

	/** The page background color */
	color: string
}

interface SamplePageState {
	chatMessages: string[]
	streamerInput: string
}

export class SamplePage extends GamepadUiView<HTMLDivElement, SamplePageProps> {
	public readonly tabName = SamplePage.name
	private chatService: TwitchChatService
	state: SamplePageState

	setState(state: Partial<SamplePageState>) {
		this.state = { ...this.state, ...state }
	}
	private chatInterval: NodeJS.Timeout | undefined

	constructor(props: SamplePageProps) {
		super(props)
		this.state = {
			chatMessages: [],
			streamerInput: '',
		}

		this.chatService = new TwitchChatService(
			'LarryGopnik', // Your Twitch username
			'mst3k' // The default channel to join
		)

		this.updateChatMessages = this.updateChatMessages.bind(this)
		this.handleSwitchStream = this.handleSwitchStream.bind(this)
	}

	componentDidMount() {
		console.log('SamplePage componentDidMount')
		this.updateChatMessages() // Call it once initially
		this.chatInterval = setInterval(this.updateChatMessages, 1000) // Update chat messages every second
	}

	componentWillUnmount() {
		console.log('SamplePage componentWillUnmount')
		if (this.chatInterval) {
			clearInterval(this.chatInterval)
		}
	}

	updateChatMessages() {
		const messages = this.chatService.getChatMessages()
		console.log('Updating chat messages:', messages)
		this.setState({ chatMessages: messages })
	}

	handleSwitchStream() {
		const { streamerInput } = this.state
		console.log('Switching stream to:', streamerInput)
		if (streamerInput) {
			this.chatService
				.changeStreamer(streamerInput)
				.then(() => {
					this.updateChatMessages() // Update chat messages after switching stream
				})
				.catch((error) => {
					console.error('Failed to switch stream:', error)
				})
		} else {
			console.log('Streamer input is empty')
		}
	}

	render(): TVNode<HTMLDivElement> {
		// TODO figure out why this isn't rendering on app inside MSFS 2024
		const { chatMessages, streamerInput } = this.state
		console.log('Rendering SamplePage with chat messages:', chatMessages)

		return (
			<div
				ref={this.gamepadUiViewRef}
				class="sample-page"
				style={`--color: ${this.props.color}`}
			>
				<div class="header">
					<h2>{this.props.title}</h2>
				</div>

				<div class="content">
					<div class="switch-stream">
						<input
							type="text"
							value={streamerInput}
							onChange={(
								e: React.ChangeEvent<HTMLInputElement>
							) =>
								this.setState({
									streamerInput: e.target.value,
								})
							}
							placeholder={this.chatService.getChannel()}
						/>
						<TTButton
							key="Switch Stream"
							type="primary"
							callback={this.handleSwitchStream}
						/>
					</div>
					<TextArea
						class="text-box"
						value={chatMessages.join('\n')}
					/>
					<div class="chat-input">
						<input
							type="text"
							placeholder="Type your message..."
						/>
						<TTButton
							key="Chat"
							type="primary"
							callback={() => {
								const inputElement =
									document.querySelector(
										'.chat-input input'
									) as HTMLInputElement
								const message = inputElement.value
								if (message) {
									this.chatService.sendMessage(
										message
									)
									inputElement.value = '' // Clear the input field after sending
									this.updateChatMessages() // Update chat messages after sending
								}
							}}
						/>
					</div>
				</div>
			</div>
		)
	}
}
