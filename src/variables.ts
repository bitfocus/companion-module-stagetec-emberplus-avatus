import { CompanionVariableDefinition } from '@companion-module/base'
import { EmberPlusConfig } from './config'

export function GetVariablesList(config: EmberPlusConfig): CompanionVariableDefinition[] {
	return (
		config.monitoredParameters?.map(({ id, label }) => ({
			name: id,
			variableId: label,
		})) ?? []
	)
}
