import MiniCodec from "../Sandbox/MiniCodec";

const UserCodec = {
    shape: {
        id: 'number',
        name: 'string',
        profile: {
            age: 'number',
            email: 'string',
            preferences: {
                theme: 'string',
                notifications: 'boolean'
            }
        }
    },
    encode(user) {
        return [
            user.id,
            ...MiniCodec.encodeString(user.name),
            user.profile.age,
            ...MiniCodec.encodeString(user.profile.email),
            ...MiniCodec.encodeString(user.profile.preferences.theme),
            user.profile.preferences.notifications ? 1 : 0
        ];
    },
    decode(encoded) {
        const posRef = { pos: 0 };

        return {
            id: encoded[posRef.pos++],
            name: MiniCodec.readString(encoded, posRef),
            profile: {
                age: encoded[posRef.pos++],
                email: MiniCodec.readString(encoded, posRef),
                preferences: {
                    theme: MiniCodec.readString(encoded, posRef),
                    notifications: Boolean(encoded[posRef.pos++])
                }
            }
        };
    }
};

const codec = new MiniCodec();
codec.register('user', UserCodec);

const userData = {
    id: 123,
    name: 'Alice',
    profile: {
        age: 30,
        email: 'alice@example.com',
        preferences: {
            theme: 'dark',
            notifications: true
        }
    }
};

const encoded = codec.encode('user', userData);
const decoded = codec.decode('user', encoded);

const dataMatches = JSON.stringify(userData) === JSON.stringify(decoded);
console.assert(dataMatches, "Decoded data does not match the original user data. Original: " + JSON.stringify(userData) + ", Decoded: " + JSON.stringify(decoded));