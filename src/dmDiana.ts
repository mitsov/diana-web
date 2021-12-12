import { MachineConfig, send, Action } from "xstate";

const cailaIntentEndpoint = `https://cors-anywhere.herokuapp.com/https://app.jaicp.com/cailapub/api/caila/p/${process.env.REACT_APP_CAILA}/nlu/inference?query=`


const cailaGetIntent = (query: string) => fetch(new Request(
    cailaIntentEndpoint + query, 
    { method: 'GET', headers: { 'Origin': 'https://maraev.me/'}})).then(data => data.json())

// const sayColour: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
//     type: "SPEAK", value: `Repainting to ${context.recResult[0].utterance}`
// }))

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'idle',
    states: {
        idle: {
            on: {
                CLICK: 'init'
            }
        },
        init: {
            on: {
                TTS_READY: 'welcome',
                CLICK: 'welcome'
            }
        },

        welcome: {
            initial: 'prompt',
            on: {
                RECOGNISED: '.next',
                TIMEOUT: '..',
            },
            states: {
                prompt: {
                    entry: say("Привет! Спроси меня что-нибудь."),
                    on: { ENDSPEECH: 'ask' }
                },
                ask: {
                    entry: send('LISTEN'),
                },
                next: {
                    invoke: {
                        id: "nlInput",
                        src: (context, _evt) => cailaGetIntent(context.recResult[0].utterance),
                        onDone: [{
                            target: 'napoleon',
                            cond: (_ctx, event) => event.data.intent.path === "/Answer:Napoleon"
                        },
                        {target: 'nenapoleon'}]
                    },

                },
                napoleon: {
                    entry: say('Наполеон!')
                },
                nenapoleon: {
                    entry: say('Не наполеон!')
                }
            }
        },
        stop: {
            entry: say("Ok"),
            always: 'init'
        },
        repaint: {
            initial: 'prompt',
            states: {
                prompt: {
                    // entry: sayColour,
                    on: { ENDSPEECH: 'repaint' }
                },
                repaint: {
                    entry: 'changeColour',
                    always: '#root.dm.welcome'
                }
            }
        }
    }
})
