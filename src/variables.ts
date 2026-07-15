import { CompanionVariableDefinition } from '@companion-module/base'
import { EmberPlusConfig } from './config'
import { EmberElement, QualifiedElement } from 'emberplus-connection/dist/model'

export function GetVariablesList(config: EmberPlusConfig): CompanionVariableDefinition[] {
	return (
		config.monitoredParameters?.map(({ node, label }) => ({
			name: (node as QualifiedElement<EmberElement>).path,
			variableId: label,
		})) ?? []
	)
}
