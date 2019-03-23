import readline from 'readline';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import cliCursor from 'cli-cursor';
import AppContext from './AppContext';
import StdinContext from './StdinContext';
import StdoutContext from './StdoutContext';

// Root component for all Ink apps
// It renders stdin and stdout contexts, so that children can access them if needed
// It also handles Ctrl+C exiting and cursor visibility
export default class App extends PureComponent {
	static propTypes = {
		children: PropTypes.node.isRequired,
		stdin: PropTypes.object.isRequired,
		stdout: PropTypes.object.isRequired,
		exitOnCtrlC: PropTypes.bool.isRequired,
		onExit: PropTypes.func.isRequired
	};

	constructor() {
		super();

		// Count how many components enabled raw mode to avoid disabling
		// raw mode until all components don't need it anymore
		this.rawModeEnabledCount = 0;
	}

	render() {
		return (
			<AppContext.Provider
				value={{
					exit: this.handleExit
				}}
			>
				<StdinContext.Provider
					value={{
						stdin: this.props.stdin,
						setRawMode: this.handleSetRawMode,
						isRawModeSupported: this.isRawModeSupported(this.props.stdin.isTTY)
					}}
				>
					<StdoutContext.Provider
						value={{
							stdout: this.props.stdout
						}}
					>
						{this.props.children}
					</StdoutContext.Provider>
				</StdinContext.Provider>
			</AppContext.Provider>
		);
	}

	componentDidMount() {
		cliCursor.hide(this.props.stdout);
	}

	componentWillUnmount() {
		cliCursor.show(this.props.stdout);

		// ignore calling setRawMode on an handle stdin it cannot be called
		if (this.isRawModeSupported(this.props.stdin)) {
			this.handleSetRawMode(false);
		}
	}

	isRawModeSupported(stdin) {
		return stdin.isTTY;
	}

	handleSetRawMode = isEnabled => {
		const {stdin} = this.props;
		if (!this.isRawModeSupported(stdin)) {
			// Do nothing if stdin doesn't support raw mode
			return;
		}

		stdin.setEncoding('utf8');

		if (isEnabled) {
			// Ensure raw mode is enabled only once
			if (this.rawModeEnabledCount === 0) {
				stdin.addListener('data', this.handleInput);
				stdin.resume();
				stdin.setRawMode(true);
				readline.emitKeypressEvents(stdin);
			}

			this.rawModeEnabledCount++;
			return;
		}

		// Disable raw mode only when no components left that are using it
		if (--this.rawModeEnabledCount === 0) {
			stdin.setRawMode(false);
			stdin.removeListener('data', this.handleInput);
			stdin.pause();
		}
	};

	handleInput = input => {
		// Exit on Ctrl+C
		if (input === '\x03' && this.props.exitOnCtrlC) { // eslint-disable-line unicorn/no-hex-escape
			this.handleExit();
		}
	};

	handleExit = error => {
		// ignore calling setRawMode on an handle stdin it cannot be called
		if (this.isRawModeSupported(this.props.stdin)) {
			this.handleSetRawMode(false);
		}
		
		this.props.onExit(error);
	}
}
