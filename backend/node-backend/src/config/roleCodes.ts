export const RoleCodes = {
    ADMIN: 6794,
    TEACHER: 2938,
    MAINTAINER: 1847,
    INACTIVE: 212, // Removed leading zero as it's an octal literal in some contexts, but here it's just a number
};

export const NameToCodeMap: Record<string, number> = {
    admin: RoleCodes.ADMIN,
    teacher: RoleCodes.TEACHER,
    maintainer: RoleCodes.MAINTAINER,
    inactive: RoleCodes.INACTIVE,
};

export const CodeToNameMap: Record<number, string> = Object.fromEntries(
    Object.entries(NameToCodeMap).map(([name, code]) => [code, name])
);

export function namesToCodes(roleNames: string[]): number[] {
    return roleNames.map(name => NameToCodeMap[name]).filter(code => code !== undefined);
}

export function codesToNames(codes: number[]): string[] {
    return codes.map(code => CodeToNameMap[code]).filter(name => name !== undefined);
}

export function isValidCode(code: number): boolean {
    return Object.values(RoleCodes).includes(code);
}
