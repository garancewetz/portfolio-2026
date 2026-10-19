// Le numéro d'un projet, sur deux chiffres : 0 → « 01 »
export const projectNumber = (i: number): string => String(i + 1).padStart(2, '0')
