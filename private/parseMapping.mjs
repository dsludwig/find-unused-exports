export default function parseMapping(arg) {
    return Object.fromEntries(arg.split(',').map((value) => value.split('=')));
}
