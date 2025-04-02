import { InstanceBase, InstanceStatus, SomeCompanionConfigField, runEntrypoint } from '@companion-module/base'
import { GetActionsList } from './actions'
import { EmberPlusConfig, GetConfigFields, parsingPath } from './config'
import { FeedbackId, GetFeedbacksList } from './feedback'
import { EmberPlusState } from './state'
import { EmberClient } from 'emberplus-connection' // note - emberplus-conn is in parent repo, not sure if it needs to be defined as dependency
import { ElementType, TreeElement, EmberElement, EmberNode, QualifiedElement } from 'emberplus-connection/dist/model'
import { GetVariablesList } from './variables'
import { RootElement } from 'emberplus-connection/dist/types'

/**
 * Companion instance class for generic EmBER+ Devices
 */
class EmberPlusInstance extends InstanceBase<EmberPlusConfig> {
	private emberClient!: EmberClient
	private config!: EmberPlusConfig
	private state!: EmberPlusState

	// Override base types to make types stricter
	public checkFeedbacks(...feedbackTypes: string[]): void {
		// todo - arg should be of type FeedbackId
		super.checkFeedbacks(...feedbackTypes)
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 */
	public async init(config: EmberPlusConfig): Promise<void> {
		this.config = config
		this.state = new EmberPlusState()

		this.setupParseFilters()
		this.setupMonitoredParams()
		this.updateCompanionBits()
		this.setupEmberConnection()
	}

	/**
	 * Process an updated configuration array.
	 */
	public async configUpdated(config: EmberPlusConfig): Promise<void> {
		this.config = config

		this.emberClient.removeAllListeners()

		this.setupParseFilters()
		this.setupMonitoredParams()
		this.updateCompanionBits()
		this.setupEmberConnection()
	}

	/**
	 * Creates the configuration fields for web config.
	 */
	public getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	/**
	 * Clean up the instance before it is destroyed.
	 */
	public async destroy(): Promise<void> {
		this.emberClient.discard()
	}

	private updateCompanionBits(): void {
		this.setActionDefinitions(GetActionsList(this, this.client, this.config))
		this.setFeedbackDefinitions(GetFeedbacksList(this, this.client, this.config))
		this.setVariableDefinitions(GetVariablesList(this.config))
	}

	private get client(): EmberClient {
		return this.emberClient
	}

	private setupEmberConnection(): void {
		this.log('debug', 'connecting ' + (this.config.host || '') + ':' + this.config.port)
		this.updateStatus(InstanceStatus.Connecting)

		this.emberClient = new EmberClient(this.config.host || '', this.config.port, 5000)

		this.emberClient.on('error', (e) => {
			this.log('error', 'Error ' + e)
		})
		this.emberClient.on('connected', () => {
			Promise.resolve()
				.then(async () => {
					const request = await this.emberClient.getDirectory(this.emberClient.tree)
					await request.response

					if (this.config.autoParse) {
						this.log('info', 'AutoParse for Parameters ...')
						for (const node of Object.values(this.emberClient.tree))
							await this.handleEmberTreeParsing(node as RootElement, '', 1)
						this.log('info', 'Finished ...')
					}
					await this.registerParameters()
					this.updateCompanionBits()

					this.updateStatus(InstanceStatus.Ok)
				})
				.catch((e) => {
					// get root
					this.updateStatus(InstanceStatus.ConnectionFailure)
					this.log('error', 'Failed to discover root or subscribe to path: ' + e)
				})
		})
		this.emberClient.on('disconnected', () => {
			this.updateStatus(InstanceStatus.Connecting)
		})
		this.emberClient.connect().catch((e) => {
			this.updateStatus(InstanceStatus.ConnectionFailure)
			this.log('error', 'Error ' + e)
		})
	}

	private setupMonitoredParams(): void {
		this.config.monitoredParameters = []
		this.config.parseParameterPaths = []
		if (this.config.monitoredParametersString) {
			const params = this.config.monitoredParametersString.split(',')
			params.map((item) => this.config.parseParameterPaths?.push({ id: item, label: item }))
		}
	}

	private setupParseFilters(): void {
		this.config.parseNodeFilter = []
		this.config.parseParamFilter = []
		this.config.autoParsePaths = []
		if (this.config.autoParsePathsString)
			this.config.autoParsePaths = this.config.autoParsePathsString
				.split(',')
				.map((path) => <parsingPath>{ path: path, elements: path.split('.') })
		if (this.config.parseNodeFilterString) this.config.parseNodeFilter = this.config.parseNodeFilterString.split(',')
		if (this.config.parseParamFilterString) this.config.parseParamFilter = this.config.parseParamFilterString.split(',')
	}

	private async registerParameters() {
		this.config.monitoredParameters ??= []
		this.log('info', 'Start parameter path registration')
		for (const param of this.config.parseParameterPaths ?? []) {
			try {
				const initial_node = await this.emberClient.getElementByPath(param.id, (node) => {
					this.handleChangedValue(param.label, node).catch((e) => this.log('error', 'Error handling parameter ' + e))
				})
				if (initial_node) {
					// add to variables
					this.config.monitoredParameters.push(param)
					this.setVariableDefinitions(GetVariablesList(this.config))
					await this.handleChangedValue(param.label, initial_node)
				}
			} catch (e) {
				this.log('error', 'Failed to subscribe to path "' + param.id + '": ' + e)
			}
		}
		this.log('info', 'Finished ...')
	}

	private async handleChangedValue(path: string, node: TreeElement<EmberElement>) {
		if (node.contents.type == ElementType.Parameter) {
			// check if enumeration value
			if (node.contents.enumeration !== undefined) {
				const curr_value = node.contents.value!
				const enumValues = node.contents.enumeration.split('\n')
				this.state.parameters.set(path, enumValues.at(curr_value as number) ?? '')
			} else {
				// check if integer value has factor to be applied
				if (node.contents.factor !== undefined) {
					const curr_value = (node.contents.value! as number) / node.contents.factor
					this.state.parameters.set(path, curr_value.toString() ?? '')
				} else this.state.parameters.set(path, node.contents.value?.toString() ?? '')
			}
			for (const feedback in FeedbackId) this.checkFeedbacks(feedback)
			this.setVariableValues({ [path]: this.state.parameters.get(path) })
		}
	}

	private async handleEmberTreeParsing(node: RootElement, identifiers: string, curr_layer: number) {
		this.config.monitoredParameters ??= []
		if (node.contents.type == ElementType.Node && this.config.monitoredParameters.length < 2048) {
			const curr_node = node as TreeElement<EmberNode>
			const req = await this.emberClient.getDirectory(node)
			await req.response
			if (node.children) {
				for (const child of Object.values(node.children)) {
					const curr_child = child as TreeElement<EmberNode>
					const curr_qchild = curr_child as QualifiedElement<EmberElement>
					const identifier = curr_child.contents.identifier?.toString().replace('#', '')
					if (this.config.autoParsePaths && this.config.autoParsePaths.length > 0) {
						for (const entry of this.config.autoParsePaths) {
							if (
								(curr_layer >= entry.elements.length && curr_qchild.path.startsWith(entry.path)) ||
								(curr_layer < entry.elements.length && entry.path.startsWith(curr_qchild.path))
							) {
								if (identifiers == '')
									await this.handleEmberTreeParsing(
										child,
										curr_node.contents.identifier?.toString().replace('#', '') + '.' + identifier,
										curr_layer + 1,
									)
								else await this.handleEmberTreeParsing(child, identifiers + '.' + identifier || '', curr_layer + 1)
								break
							}
						}
					} else {
						if (this.config.monitoredParameters.length > 2048) return
						if (identifiers == '')
							await this.handleEmberTreeParsing(
								child,
								curr_node.contents.identifier?.toString().replace('#', '') + '.' + identifier,
								curr_layer + 1,
							)
						else await this.handleEmberTreeParsing(child, identifiers + '.' + identifier || '', curr_layer + 1)
					}
				}
			}
		} else if (node.contents.type == ElementType.Parameter) {
			const curr_node = node as TreeElement<EmberNode>
			const curr_qnode = node as QualifiedElement<EmberElement>
			try {
				if (this.config.parseNodeFilterString) {
					for (const nodeFilter of this.config.parseNodeFilter ?? []) {
						if (identifiers.includes(nodeFilter)) {
							if (this.config.parseParamFilter?.length) {
								for (const paramFilter of this.config.parseParamFilter ?? []) {
									if (curr_node.contents.identifier?.toString() == paramFilter) {
										await this._addMonitoredParameter(curr_qnode, identifiers)
										return
									}
								}
							} else {
								await this._addMonitoredParameter(curr_qnode, identifiers)
								return
							}
						}
					}
				} else if (this.config.parseParamFilterString) {
					if (this.config.parseParamFilter?.length) {
						for (const paramFilter of this.config.parseParamFilter ?? []) {
							if (curr_node.contents.identifier?.toString() == paramFilter) {
								await this._addMonitoredParameter(curr_qnode, identifiers)
								return
							}
						}
					}
				} else await this._addMonitoredParameter(curr_qnode, identifiers)
			} catch (e) {
				this.log('error', 'Failed to subscribe to path "' + identifiers + '": ' + e)
			}
		}
	}

	private async _addMonitoredParameter(node: QualifiedElement<EmberElement>, label: string) {
		this.config.monitoredParameters!.push({ id: node.path, label: label })

		this.setVariableDefinitions(GetVariablesList(this.config))

		const initial_node = await this.emberClient.getElementByPath(node.path, (node) => {
			this.handleChangedValue(label, node).catch((e) => this.log('error', 'Error handling parameter ' + e))
		})
		if (initial_node) {
			//this.log('debug', 'Registered for path "' + label + '"')
			await this.handleChangedValue(label, initial_node)
		}
	}
}

runEntrypoint(EmberPlusInstance, [])
