import { Regex, SomeCompanionConfigField } from '@companion-module/base'

export const portDefault = 9000

export type monitoredParameters = { id: string; label: string }
export type parsingPath = { path: string; elements: string[] }

export interface EmberPlusConfig {
	host?: string
	port?: number
	take?: boolean
	autoParse?: boolean
	parseNodeFilter?: string[]
	parseNodeFilterString?: string
	parseParamFilter?: string[]
	parseParamFilterString?: string
	monitoredParametersString?: string
	autoParsePathsString?: string
	autoParsePaths?: parsingPath[]
	monitoredParameters?: monitoredParameters[]
	parseParameterPaths?: monitoredParameters[]
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			tooltip: 'The IP of the ember+ provider',
			width: 6,
			regex: Regex.IP,
		},
		{
			type: 'number',
			id: 'port',
			label: 'Target Port',
			tooltip: 'Usually 9000 by default',
			width: 6,
			min: 1,
			max: 0xffff,
			step: 1,
			default: portDefault,
		},
		{
			type: 'checkbox',
			id: 'autoParse',
			label: 'Enable Tree Auto-Parse?',
			tooltip: 'CAUTION: limited to 2048 Nodes',
			width: 6,
			default: false,
		},
		{
			type: 'textinput',
			id: 'autoParsePathsString',
			label: 'number Paths to selective Ember tree parts for Auto-Parse',
			tooltip: 'Please separate by comma (CAUTION: with value "0" limited to 2048 Nodes)',
			width: 12,
		},
		{
			type: 'textinput',
			id: 'parseNodeFilterString',
			label: 'Filter identifiers of Nodes',
			tooltip: 'Please separate by comma',
			width: 12,
		},
		{
			type: 'textinput',
			id: 'parseParamFilterString',
			label: 'Filter identifiers of Parameters',
			tooltip: 'Please separate by comma',
			width: 12,
		},
		{
			type: 'textinput',
			id: 'monitoredParametersString',
			label: 'number Paths to parameters to monitor',
			tooltip: 'Please separate by coma',
			width: 12,
		},
	]
}
