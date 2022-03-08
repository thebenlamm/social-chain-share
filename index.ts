import { sha256 } from 'react-native-sha256';

class MerkleNode {
  name: string;
  value: string;

  constructor(name: string, value: string) {
      this.name = name;
      this.value = value;
  }

  get hash() {
      return sha256(this.value);
  }
}

class MerkleContainer<T extends { hash: Promise<string> }> {
  name: string;
  value: T[];

  constructor(name: string, value: T[]) {
      this.name = name;
      this.value = value;
  }

  get hash() {
      return Promise.all(this.value.map(child => child.hash))
          .then((hashes: string[]) => hashes.join(''))
          .then((hash: string) => sha256(hash));
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
    tag: string;

    constructor(pubKey: string, pi: PersonalInformation, options: { type?: Type, tag?: string } = {}) {
        this.pi = pi;
        this.pubKey = pubKey.replace(/(\r\n|\n|\r)/gm, '');
        this.version = '1.0.3';
        this.type = options.type || 'personal';
        this.tag = options.tag || '';
    }

    static fromString(str: string): Share {
        const json = JSON.parse(str);
        return new Share(json.pubKey, json.pi, {
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

    get hash(): Promise<string> {
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
