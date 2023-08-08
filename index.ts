import sjcl from 'sjcl';
const sha256 = (input: string): string => sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(input));

class MerkleNode {
    name: string;
    hash: string;
    value: string;

    constructor(name: string, value: string) {
        this.name = name;
        this.value = value;
        this.hash = sha256(value);
    }
}

class MerkleContainer<T extends {hash:string}> {
    name: string;
    hash: string;
    value: T[];

    constructor(name: string, value: T[]) {
        this.name = name;
        this.value = value;
        this.hash = sha256(value.map(child => child.hash).join(''));
    }
}

export type Type = 'personal' | 'alias';

export interface PersonalInformation {
    name?: {
        firstName?: string;
        lastName?: string;
    },
    contact?: {
        email?: string;
        phone?: string;
    },
    address?: {
        address?: string;
        city?: string;
        state?: string;
        zip?: string;
    },
    social?: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
    }
}  

export class Share {
    pi: PersonalInformation;
    pubKey: string;
    version: string;
    type: Type;
    tag: string;

    constructor(pubKey: string, pi: PersonalInformation, options: { version?: string, type?: Type, tag?: string } = {}) {
        this.pi = pi;
        this.pubKey = pubKey.replace(/(\r\n|\n|\r)/gm, '');
        this.version = options.version || Share.version();
        this.type = options.type || 'personal';
        this.tag = options.tag || '';
    }

    static version(): string {
        return '1.1.2';
    }

    static fromString(str: string): Share {
        const json = JSON.parse(str);
        return new Share(json.pubKey, json.pi, {
            version: json.version,
            type: json.type,
            tag: json.tag
        });
    }

    toString(): string {
        return JSON.stringify({
            pi: this.pi,
            pubKey: this.pubKey,
            version: this.version,
            type: this.type,
            tag: this.tag
        });
    }

    get hash(): string {
        const firstName = new MerkleNode('firstName', this.pi?.name?.firstName || '');
        const lastName = new MerkleNode('LastName', this.pi?.name?.lastName || '');
        const nameContainer = new MerkleContainer('name', [firstName, lastName]);

        const email = new MerkleNode('email', this.pi?.contact?.email || '');
        const phone = new MerkleNode('phone', this.pi?.contact?.phone || '');
        const contactContainer = new MerkleContainer('contact', [email, phone]);

        const address = new MerkleNode('address', this.pi?.address?.address || '');
        const city = new MerkleNode('city', this.pi?.address?.city || '');
        const state = new MerkleNode('state', this.pi?.address?.state || '');
        const zip = new MerkleNode('zip', this.pi?.address?.zip || '');
        const addressContainer = new MerkleContainer('address', [address, city, state, zip]);

        const facebook = new MerkleNode('facebook', this.pi?.social?.facebook || '');
        const twitter = new MerkleNode('twitter', this.pi?.social?.twitter || '');
        const instagram = new MerkleNode('instagram', this.pi?.social?.instagram || '');
        const socialContainer = new MerkleContainer('social', [facebook, twitter, instagram]);

        const pubkey = new MerkleNode('pubkey', this.pubKey);
        const pubkeyContainer = new MerkleContainer('pubkey', [pubkey]);

        const root = new MerkleContainer('root', [nameContainer, contactContainer, addressContainer, socialContainer, pubkeyContainer]);
        return root.hash;
    }
}
