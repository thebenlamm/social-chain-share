import { createHash } from 'crypto';
const sha256 = (input: string): string => createHash('sha256').update(input, 'utf8').digest('hex');

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
  name: string;
  phone: string;
}

export class Share {
    pi: PersonalInformation
    pubKey: string;
    version: string;
    type: Type;

    constructor(pubKey: string, pi: PersonalInformation, options: { type?: Type } = {}) {
        this.pi = pi;
        this.pubKey = pubKey.replace(/(\r\n|\n|\r)/gm, '');
        this.version = '1.0';
        this.type = options.type || 'personal';
    }

    static fromString(str: string): Share {
        const json = JSON.parse(str);
        return new Share(json.pubKey, json.pi);
    }

    toString(): string {
        return JSON.stringify({
            pi: this.pi,
            pubKey: this.pubKey,
            version: this.version
        });
    }

    get hash(): string {
        const name = new MerkleNode('name', this.pi.name);
        const nameContainer = new MerkleContainer('name', [name]);

        const phone = new MerkleNode('phone', this.pi.phone);
        const contactContainer = new MerkleContainer('phone', [phone]);

        const pubkey = new MerkleNode('pubkey', this.pubKey);
        const pubkeyContainer = new MerkleContainer('pubkey', [pubkey]);

        const root = new MerkleContainer('root', [nameContainer, contactContainer, pubkeyContainer]);
        return root.hash;
    }
}
