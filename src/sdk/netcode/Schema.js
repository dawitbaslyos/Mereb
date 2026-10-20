/**
 * Mereb SDK - Declarative State Schema System
 * Enables defining multiplayer game state in 5 lines of code.
 * Automatically generates zero-overhead binary serialization & deserialization.
 * Inspired by Photon Engine / FlatBuffers, optimized for WebRTC DataChannels.
 */
import { BinaryWriter, BinaryReader } from './BinaryStream.js';

export function defineSchema(fields) {
  const fieldList = Object.entries(fields).map(([name, config]) => {
    if (typeof config === 'string') {
      return { name, type: config, scale: config === 'fixed16' ? 100 : 1 };
    }
    return {
      name,
      type: config.type || 'fixed16',
      scale: config.scale || 100
    };
  });

  const sharedWriter = new BinaryWriter(512);

  return {
    fields: fieldList,

    /**
     * Encode a state object into an ArrayBuffer
     */
    encode(data, existingWriter = null) {
      const writer = existingWriter || sharedWriter.reset();

      for (let i = 0; i < fieldList.length; i++) {
        const { name, type, scale } = fieldList[i];
        const val = data ? data[name] : 0;

        switch (type) {
          case 'uint8':
            writer.writeUint8(val || 0);
            break;
          case 'int8':
            writer.writeInt8(val || 0);
            break;
          case 'uint16':
            writer.writeUint16(val || 0);
            break;
          case 'int16':
            writer.writeInt16(val || 0);
            break;
          case 'uint32':
            writer.writeUint32(val || 0);
            break;
          case 'int32':
            writer.writeInt32(val || 0);
            break;
          case 'float32':
            writer.writeFloat32(val || 0);
            break;
          case 'fixed16':
            writer.writeFixed16(val || 0, scale);
            break;
          case 'boolean':
          case 'bool':
            writer.writeBoolean(!!val);
            break;
          case 'string':
            writer.writeString(val || '');
            break;
          default:
            writer.writeFloat32(val || 0);
            break;
        }
      }

      return existingWriter ? writer : writer.getView();
    },

    /**
     * Decode an ArrayBuffer or BinaryReader into a state object
     */
    decode(source) {
      const reader = source instanceof BinaryReader ? source : new BinaryReader(source);
      const result = {};

      for (let i = 0; i < fieldList.length; i++) {
        const { name, type, scale } = fieldList[i];

        switch (type) {
          case 'uint8':
            result[name] = reader.readUint8();
            break;
          case 'int8':
            result[name] = reader.readInt8();
            break;
          case 'uint16':
            result[name] = reader.readUint16();
            break;
          case 'int16':
            result[name] = reader.readInt16();
            break;
          case 'uint32':
            result[name] = reader.readUint32();
            break;
          case 'int32':
            result[name] = reader.readInt32();
            break;
          case 'float32':
            result[name] = reader.readFloat32();
            break;
          case 'fixed16':
            result[name] = reader.readFixed16(scale);
            break;
          case 'boolean':
          case 'bool':
            result[name] = reader.readBoolean();
            break;
          case 'string':
            result[name] = reader.readString();
            break;
          default:
            result[name] = reader.readFloat32();
            break;
        }
      }

      return result;
    }
  };
}
