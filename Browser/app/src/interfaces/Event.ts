export interface Event {
    name: 'scroll' | 'URLChange' | 'scroll' | 'click' | 'focusin' | 'focusout' | 'keypress',
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