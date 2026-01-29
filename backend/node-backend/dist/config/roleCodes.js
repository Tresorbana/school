export const RoleCodes = {
    ADMIN: 6794,
    TEACHER: 2938,
    NURSE: 4923,
    DISCIPLINE: 9029,
    MAINTAINER: 1847,
    INACTIVE: 212, // Removed leading zero as it's an octal literal in some contexts, but here it's just a number
};
export const NameToCodeMap = {
    admin: RoleCodes.ADMIN,
    teacher: RoleCodes.TEACHER,
    nurse: RoleCodes.NURSE,
    discipline: RoleCodes.DISCIPLINE,
    maintainer: RoleCodes.MAINTAINER,
    inactive: RoleCodes.INACTIVE,
};
export const CodeToNameMap = Object.fromEntries(Object.entries(NameToCodeMap).map(([name, code]) => [code, name]));
export function namesToCodes(roleNames) {
    return roleNames.map(name => NameToCodeMap[name]).filter(code => code !== undefined);
}
export function codesToNames(codes) {
    return codes.map(code => CodeToNameMap[code]).filter(name => name !== undefined);
}
export function isValidCode(code) {
    return Object.values(RoleCodes).includes(code);
}
