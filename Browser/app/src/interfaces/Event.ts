export interface Event {
    name: string,
    timestamp: number,
    parameters: Parameters
}

interface Parameters {
    tab_name: string,
    url: string,
    x?: number,
    y?: number,
    startsTimestamp?: number,
    endsTimestamp?: number
}