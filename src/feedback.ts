import {
	CompanionFeedbackDefinition,
	CompanionFeedbackDefinitions,
	combineRgb,
	InstanceBase,
	DropdownChoice,
} from '@companion-module/base'
import { EmberClient } from 'emberplus-connection'
import { EmberPlusConfig } from './config'

export enum FeedbackId {
	Parameter = 'parameter',
	hitThreshold = 'hitThreshold',
	belowThreshold = 'belowThreshold',
	boolEqual = 'booleanEqual,',
	enumEqual = 'enumerationEqual',
}

export function GetFeedbacksList(
	_self: InstanceBase<EmberPlusConfig>,
	_emberClient: EmberClient,
	config: EmberPlusConfig,
): CompanionFeedbackDefinitions {
	const feedbacks: { [id in FeedbackId]: CompanionFeedbackDefinition | undefined } = {
		[FeedbackId.Parameter]: {
			name: 'Parameter Equals',
			description: 'Checks the current value of a paramter',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 255),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'path',
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
				},
			],
			callback: (feedback) => {
				return (
					(_self.getVariableValue(feedback.options['path']?.toString() ?? '') as number) == feedback.options['value']
				)
			},
		},
		[FeedbackId.boolEqual]: {
			name: 'Bool Parameter Equals',
			description: 'Checks the current value of a paramter',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 255),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'path',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'checkbox',
					label: 'Value',
					id: 'value',
					default: true,
				},
			],
			callback: (feedback) => {
				return (
					(_self.getVariableValue(feedback.options['path']?.toString() ?? '') as boolean) == feedback.options['value']
				)
			},
		},
		[FeedbackId.enumEqual]: {
			name: 'Enum Parameter Equals',
			description: 'Checks the current value of a paramter',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 255),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'path',
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
			callback: (feedback) => {
				return _self.getVariableValue(feedback.options['path']?.toString() ?? '') == feedback.options['value']
			},
		},
		[FeedbackId.hitThreshold]: {
			name: 'Parameter hit Threshold',
			description: 'Checks the current value of a paramter against the threshold',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 255),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'path',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'number',
					label: 'Threshold',
					id: 'threshold',
					required: true,
					min: -0xffffffff,
					max: 0xffffffff,
					default: 0,
				},
			],
			callback: (feedback) => {
				return (
					(_self.getVariableValue(feedback.options['path']?.toString() ?? '') as number) >
					(feedback.options['threshold'] as number)
				)
			},
		},
		[FeedbackId.belowThreshold]: {
			name: 'Parameter below Threshold',
			description: 'Checks the current value of a paramter to be below the threshold',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 255),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'path',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'number',
					label: 'Threshold',
					id: 'threshold',
					required: true,
					min: -0xffffffff,
					max: 0xffffffff,
					default: 0,
				},
			],
			callback: (feedback) => {
				return (
					(_self.getVariableValue(feedback.options['path']?.toString() ?? '') as number) <
					(feedback.options['threshold'] as number)
				)
			},
		},
	}
	return feedbacks
}
