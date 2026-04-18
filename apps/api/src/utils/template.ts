interface TemplateVars {
  nome_paciente: string
  ultimo_procedimento?: string
  dias_inativo?: number
  nome_clinica?: string
}

export function interpolateTemplate(template: string, vars: TemplateVars): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = vars[key as keyof TemplateVars]
    return value !== undefined ? String(value) : match
  })
}

export const OPT_OUT_FOOTER = '\n\n_Para não receber mais mensagens, responda SAIR._'

export function addOptOutFooter(message: string): string {
  return message + OPT_OUT_FOOTER
}
