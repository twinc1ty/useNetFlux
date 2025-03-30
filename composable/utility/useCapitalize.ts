// export function useCapitalize(input: string): string {
//     if (!input) return input;
//     return input.charAt(0).toUpperCase() + input.slice(1);
// }

export const useCapitalize = (input: string): string => {
    if (!input) return input;
    return input.charAt(0).toUpperCase() + input.slice(1);
}