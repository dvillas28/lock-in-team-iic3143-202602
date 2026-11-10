import { ApiHttpError } from '../api/errors.ts';
import { publicationSelection, receiptDto, type PublicationSelection, type Receipt } from './validation.ts';
export class PublicationOperation {
    state: 'sending' | 'uncertain' | 'confirmed' | 'rejected' | 'ready' | 'disposed' = 'ready';
    input?: PublicationSelection;
    key?: string;
    receipt?: Receipt;
    error?: unknown;
    private pending?: Promise<void>;
    constructor(private scope: string, input: PublicationSelection, key: string) {
        const v = publicationSelection(input);
        for (const a of Object.values(v)) {
            Object.freeze(a);
        }
        this.input = Object.freeze(v);
        this.key = key;
    }
    async send(scope: string, post: (input: PublicationSelection, key: string) => Promise<Receipt>): Promise<void> {
        if (scope !== this.scope || !this.input || !this.key || this.state === 'disposed') {
            throw new Error('Contexto perdido.');
        }
        if (this.pending) {
            return this.pending;
        }
        if (this.state === 'confirmed') {
            return;
        }
        this.state = 'sending';
        this.error = undefined;
        const work = post(this.input, this.key).then(v => {
            if (this.state === 'disposed') {
                return;
            }
            this.receipt = receiptDto(v);
            this.state = 'confirmed';
        }).catch(e => {
            if (this.state === 'disposed') {
                return;
            }
            this.error = e;
            this.state = e instanceof ApiHttpError && e.status >= 400 && e.status < 500 ? 'rejected' : 'uncertain';
        });
        this.pending = work;
        await work;
        this.pending = undefined;
    }
    dispose() {
        this.state = 'disposed';
        this.input = undefined;
        this.key = undefined;
        this.receipt = undefined;
        this.error = undefined;
        this.scope = '';
    }
}
