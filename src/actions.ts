import {
	CompanionActionDefinition,
	CompanionActionDefinitions,
	CompanionActionEvent,
	CompanionInputFieldTextInput,
	InstanceBase,
	DropdownChoice,
} from '@companion-module/base'
import { EmberClient, Model as EmberModel } from 'emberplus-connection'
import { EmberPlusConfig } from './config'

export enum ActionId {
	SetValueInt = 'setValueInt',
	SetValueReal = 'setValueReal',
	SetValueString = 'setValueString',
	SetValueBoolean = 'setValueBoolean',
	SetValueEnum = 'setValueEnum',
	SetValueExpression = 'setValueExpression',
	SetIncrement = 'setValueIncrement',
	SetDecrement = 'setValueDecrement',
	ToogleBoolean = 'toggleValue',
}

const pathInput: CompanionInputFieldTextInput = {
	type: 'textinput',
	label: 'Path',
	id: 'path',
}

const setValue =
	(self: InstanceBase<EmberPlusConfig>, emberClient: EmberClient, type: EmberModel.ParameterType) =>
	async (action: CompanionActionEvent): Promise<void> => {
		let selected_path = ''
		if (action.options['use_select']) selected_path = action.options['varPath'] as string
		else selected_path = action.options['path'] as string

		const param_node = await emberClient.getElementByPath(selected_path)

		let value = action.options['value']

		if (param_node && param_node.contents.type === EmberModel.ElementType.Parameter) {
			if (type == EmberModel.ParameterType.Integer && param_node.contents.maximum) {
				// check integer against Min/Max Ember+ value
				if (param_node.contents.enumeration == undefined && (value as number) > param_node.contents.maximum)
					value = param_node.contents.maximum
				else if (
					param_node.contents.enumeration == undefined &&
					(value as number) < (param_node.contents.minimum as number)
				)
					value = param_node.contents.minimum as number
			}
			if (type == EmberModel.ParameterType.Boolean) {
				await emberClient.setValue(
					param_node as EmberModel.NumberedTreeNode<EmberModel.Parameter>,
					value as boolean,
					false,
				)
			} else if (param_node.contents.maximum || !isNaN(Number(value))) {
				await emberClient.setValue(
					param_node as EmberModel.NumberedTreeNode<EmberModel.Parameter>,
					value as number,
					false,
				)
			} else if (type == EmberModel.ParameterType.String) {
				await emberClient.setValue(
					param_node as EmberModel.NumberedTreeNode<EmberModel.Parameter>,
					value as string,
					false,
				)
			} else {
				self.log('warn', 'Node ' + selected_path + ' is not of type ' + type + ' (is ' + param_node.contents.type + ')')
			}
		} else {
			self.log('warn', 'Parameter ' + selected_path + ' not found or not a parameter')
		}
	}

const setValueExpression =
	(self: InstanceBase<EmberPlusConfig>, emberClient: EmberClient) =>
	async (action: CompanionActionEvent): Promise<void> => {
		let selected_path = ''
		if (action.options['use_select']) selected_path = action.options['varPath'] as string
		else selected_path = action.options['path'] as string

		const param_node = await emberClient.getElementByPath(selected_path)

		if (param_node && param_node.contents.type === EmberModel.ElementType.Parameter) {
			if (param_node.contents.maximum) {
				self.log('debug', 'Got node on ' + action.options['path'] + 'set val: ' + action.options['value'])
				let value = await self.parseVariablesInString(action.options['value'] as string)

				// check integer against Min/Max Ember+ value
				if (param_node.contents.maximum != undefined && value > String(param_node.contents.maximum))
					value = String(param_node.contents.maximum)
				else if (param_node.contents.maximum != undefined && value < String(param_node.contents.minimum))
					value = String(param_node.contents.minimum)

				await emberClient.setValue(
					param_node as EmberModel.NumberedTreeNode<EmberModel.Parameter>,
					Number(value),
					false,
				)
			} else {
				self.log(
					'warn',
					'Node ' +
						selected_path +
						' is not of type ' +
						EmberModel.ParameterType.Integer +
						' or ' +
						EmberModel.ParameterType.Enum +
						' (is ' +
						param_node.contents.type +
						')',
				)
			}
		} else {
			self.log('warn', 'Parameter ' + selected_path + ' not found or not a parameter')
		}
	}

const setIncrementDecrement =
	(self: InstanceBase<EmberPlusConfig>, emberClient: EmberClient, type: string) =>
	async (action: CompanionActionEvent): Promise<void> => {
		let selected_path = ''
		if (action.options['use_select']) selected_path = action.options['varPath'] as string
		else selected_path = action.options['path'] as string

		const param_node = await emberClient.getElementByPath(selected_path)

		if (param_node && param_node.contents.type === EmberModel.ElementType.Parameter) {
			// check if integer or enum (parameter types have Content 'minimum' or 'maximum') -> value in Content 'type' is always string
			if (param_node.contents.maximum) {
				if (type === 'increment') {
					// check integer against Max Ember+ value
					if (
						param_node.contents.maximum != undefined &&
						Number(param_node.contents.value) + (action.options['value'] as number) > param_node.contents.maximum
					) {
						await emberClient.setValue(
							param_node as EmberModel.NumberedTreeNode<EmberModel.Parameter>,
							Number(param_node.contents.maximum),
							false,
						)
					} else {
						await emberClient.setValue(
							param_node as EmberModel.NumberedTreeNode<EmberModel.Parameter>,
							Number(param_node.contents.value) + (action.options['value'] as number),
							false,
						)
					}
				} else {
					// check integer against Min Ember+ value
					if (
						param_node.contents.minimum != undefined &&
						Number(param_node.contents.value) - (action.options['value'] as number) < param_node.contents.minimum
					) {
						await emberClient.setValue(
							param_node as EmberModel.NumberedTreeNode<EmberModel.Parameter>,
							Number(param_node.contents.minimum),
							false,
						)
					} else {
						await emberClient.setValue(
							param_node as EmberModel.NumberedTreeNode<EmberModel.Parameter>,
							Number(param_node.contents.value) - (action.options['value'] as number),
							false,
						)
					}
				}
			} else {
				self.log(
					'warn',
					'Node ' +
						selected_path +
						' is not of type ' +
						EmberModel.ParameterType.Integer +
						' or ' +
						EmberModel.ParameterType.Enum +
						' (is ' +
						param_node.contents.type +
						')',
				)
			}
		} else {
			self.log('warn', 'Parameter ' + selected_path + ' not found or not a parameter')
		}
	}

const setToggle =
	(self: InstanceBase<EmberPlusConfig>, emberClient: EmberClient) =>
	async (action: CompanionActionEvent): Promise<void> => {
		let selected_path = ''
		if (action.options['use_select']) selected_path = action.options['varPath'] as string
		else selected_path = action.options['path'] as string

		const param_node = await emberClient.getElementByPath(selected_path)

		if (param_node && param_node.contents.type === EmberModel.ElementType.Parameter) {
			// check if boolean
			if (param_node.contents.value === true || param_node.contents.value === false) {
				if (param_node.contents.value === true)
					await emberClient.setValue(param_node as EmberModel.NumberedTreeNode<EmberModel.Parameter>, false, false)
				else await emberClient.setValue(param_node as EmberModel.NumberedTreeNode<EmberModel.Parameter>, true, false)
			} else {
				self.log('warn', 'Node ' + selected_path + ' is not of type Boolean')
			}
		} else {
			self.log('warn', 'Parameter ' + selected_path + ' not found or not a parameter')
		}
	}

export function GetActionsList(
	self: InstanceBase<EmberPlusConfig>,
	emberClient: EmberClient,
	config: EmberPlusConfig,
): CompanionActionDefinitions {
	const actions: { [id in ActionId]: CompanionActionDefinition | undefined } = {
		[ActionId.SetValueInt]: {
			name: 'Set Value Integer',
			options: [
				pathInput,
				{
					type: 'checkbox',
					label: 'Use Selected',
					id: 'use_select',
					default: false,
				},
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'varPath',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'number',
					label: 'Value',
					id: 'value',
					required: true,
					min: -0xffffffff,
					max: 0xffffffff,
					default: 0,
					step: 1,
				},
			],
			callback: setValue(self, emberClient, EmberModel.ParameterType.Integer),
		},
		[ActionId.SetValueReal]: {
			name: 'Set Value Real',
			options: [
				pathInput,
				{
					type: 'checkbox',
					label: 'Use Selected',
					id: 'use_select',
					default: false,
				},
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'varPath',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'number',
					label: 'Value',
					id: 'value',
					required: true,
					min: -0xffffffff,
					max: 0xffffffff,
					default: 0,
					step: 0.001, // TODO - don't want this at all preferably
				},
			],
			callback: setValue(self, emberClient, EmberModel.ParameterType.Real),
		},
		[ActionId.SetValueBoolean]: {
			name: 'Set Value Boolean',
			options: [
				pathInput,
				{
					type: 'checkbox',
					label: 'Use Selected',
					id: 'use_select',
					default: false,
				},
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'varPath',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'checkbox',
					label: 'Value',
					id: 'value',
					default: false,
				},
			],
			callback: setValue(self, emberClient, EmberModel.ParameterType.Boolean),
		},
		[ActionId.SetValueEnum]: {
			name: 'Set Value ENUM (as Integer)',
			options: [
				pathInput,
				{
					type: 'checkbox',
					label: 'Use Selected',
					id: 'use_select',
					default: false,
				},
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'varPath',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'number',
					label: 'Value',
					id: 'value',
					required: true,
					min: 0x00000000,
					max: 0xffffffff,
					default: 0,
					step: 1,
				},
			],
			callback: setValue(self, emberClient, EmberModel.ParameterType.Enum),
		},
		[ActionId.SetValueString]: {
			name: 'Set Value String',
			options: [
				pathInput,
				{
					type: 'checkbox',
					label: 'Use Selected',
					id: 'use_select',
					default: false,
				},
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'varPath',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'textinput',
					label: 'Value',
					id: 'value',
				},
			],
			callback: setValue(self, emberClient, EmberModel.ParameterType.String),
		},
		[ActionId.SetValueExpression]: {
			name: 'Set Value with Expression',
			options: [
				pathInput,
				{
					type: 'checkbox',
					label: 'Use Selected',
					id: 'use_select',
					default: false,
				},
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'varPath',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'textinput',
					label: 'Value',
					id: 'value',
					useVariables: true,
				},
			],
			callback: setValueExpression(self, emberClient),
		},
		[ActionId.SetIncrement]: {
			name: 'Set Value Increment',
			options: [
				pathInput,
				{
					type: 'checkbox',
					label: 'Use Selected',
					id: 'use_select',
					default: false,
				},
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'varPath',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'number',
					label: 'Value',
					id: 'value',
					required: true,
					min: 0,
					max: 0xffffffff,
					default: 1,
					step: 1,
				},
			],
			callback: setIncrementDecrement(self, emberClient, 'increment'),
		},
		[ActionId.SetDecrement]: {
			name: 'Set Value Decrement',
			options: [
				pathInput,
				{
					type: 'checkbox',
					label: 'Use Selected',
					id: 'use_select',
					default: false,
				},
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'varPath',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'number',
					label: 'Value',
					id: 'value',
					required: true,
					min: 0,
					max: 0xffffffff,
					default: 1,
					step: 1,
				},
			],
			callback: setIncrementDecrement(self, emberClient, 'decrement'),
		},
		[ActionId.ToogleBoolean]: {
			name: 'Toggle Value Boolean',
			options: [
				pathInput,
				{
					type: 'checkbox',
					label: 'Use Selected',
					id: 'use_select',
					default: false,
				},
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'varPath',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
			],
			callback: setToggle(self, emberClient),
		},
	}
	return actions
}
