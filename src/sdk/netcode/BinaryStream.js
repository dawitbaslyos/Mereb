/**
 * Mereb SDK - Ultra-Fast Zero-Allocation Binary Serialization
 * Compact binary packing over WebRTC RTCDataChannel using DataView and ArrayBuffer.
 */

const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder() : null;

export class BinaryWriter {
  constructor(initialCapacity = 512) {
    this.capacity = initialCapacity;
    this.buffer = new ArrayBuffer(this.capacity);
    this.view = new DataView(this.buffer);
    this.offset = 0;
  }

  _ensureCapacity(bytesNeeded) {
    if (this.offset + bytesNeeded > this.capacity) {
      let newCapacity = this.capacity * 2;
      while (this.offset + bytesNeeded > newCapacity) {
        newCapacity *= 2;
      }
      const newBuffer = new ArrayBuffer(newCapacity);
      new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));
      this.buffer = newBuffer;
      this.view = new DataView(this.buffer);
      this.capacity = newCapacity;
    }
  }

  reset() {
    this.offset = 0;
    return this;
  }

  writeUint8(value) {
    this._ensureCapacity(1);
    this.view.setUint8(this.offset, value);
    this.offset += 1;
    return this;
  }

  writeInt8(value) {
    this._ensureCapacity(1);
    this.view.setInt8(this.offset, value);
    this.offset += 1;
    return this;
  }

  writeBoolean(value) {
    return this.writeUint8(value ? 1 : 0);
  }

  writeUint16(value) {
    this._ensureCapacity(2);
    this.view.setUint16(this.offset, value, true); // Little endian
    this.offset += 2;
    return this;
  }

  writeInt16(value) {
    this._ensureCapacity(2);
    this.view.setInt16(this.offset, value, true);
    this.offset += 2;
    return this;
  }

  writeUint32(value) {
    this._ensureCapacity(4);
    this.view.setUint32(this.offset, value, true);
    this.offset += 4;
    return this;
  }

  writeInt32(value) {
    this._ensureCapacity(4);
    this.view.setInt32(this.offset, value, true);
    this.offset += 4;
    return this;
  }

  writeFloat32(value) {
    this._ensureCapacity(4);
    this.view.setFloat32(this.offset, value, true);
    this.offset += 4;
    return this;
  }

  writeFloat64(value) {
    this._ensureCapacity(8);
    this.view.setFloat64(this.offset, value, true);
    this.offset += 8;
    return this;
  }

  /**
   * Compact fixed-point compression for float values (coordinates, velocities, angles)
   * Example: value = 14.52, scale = 100 -> stored as int16 (1452) in 2 bytes instead of 4 bytes!
   */
  writeFixed16(value, scale = 100) {
    const clamped = Math.max(-32768, Math.min(32767, Math.round(value * scale)));
    return this.writeInt16(clamped);
  }

  writeFixed8(value, scale = 10) {
    const clamped = Math.max(-128, Math.min(127, Math.round(value * scale)));
    return this.writeInt8(clamped);
  }

  writeString(str) {
    if (!textEncoder) {
      const len = str.length;
      this.writeUint16(len);
      for (let i = 0; i < len; i++) {
        this.writeUint8(str.charCodeAt(i));
      }
      return this;
    }
    const encoded = textEncoder.encode(str);
    this.writeUint16(encoded.length);
    this._ensureCapacity(encoded.length);
    new Uint8Array(this.buffer, this.offset, encoded.length).set(encoded);
    this.offset += encoded.length;
    return this;
  }

  writeBytes(uint8Array) {
    this._ensureCapacity(uint8Array.length);
    new Uint8Array(this.buffer, this.offset, uint8Array.length).set(uint8Array);
    this.offset += uint8Array.length;
    return this;
  }

  /**
   * Returns a copy of the written bytes as an ArrayBuffer
   */
  getBuffer() {
    return this.buffer.slice(0, this.offset);
  }

  /**
   * Returns a Uint8Array view of the written bytes without copying
   */
  getView() {
    return new Uint8Array(this.buffer, 0, this.offset);
  }

  get length() {
    return this.offset;
  }
}

export class BinaryReader {
  constructor(bufferOrView) {
    if (bufferOrView instanceof ArrayBuffer) {
      this.buffer = bufferOrView;
      this.view = new DataView(this.buffer);
      this.byteLength = this.buffer.byteLength;
    } else if (ArrayBuffer.isView(bufferOrView)) {
      this.buffer = bufferOrView.buffer;
      this.view = new DataView(this.buffer, bufferOrView.byteOffset, bufferOrView.byteLength);
      this.byteLength = bufferOrView.byteLength;
    } else {
      throw new Error('BinaryReader requires an ArrayBuffer or TypedArray view');
    }
    this.offset = 0;
  }

  seek(position) {
    this.offset = Math.max(0, Math.min(this.byteLength, position));
    return this;
  }

  readUint8() {
    const val = this.view.getUint8(this.offset);
    this.offset += 1;
    return val;
  }

  readInt8() {
    const val = this.view.getInt8(this.offset);
    this.offset += 1;
    return val;
  }

  readBoolean() {
    return this.readUint8() !== 0;
  }

  readUint16() {
    const val = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return val;
  }

  writeInt16() {
    const val = this.view.getInt16(this.offset, true);
    this.offset += 2;
    return val;
  }

  readInt16() {
    const val = this.view.getInt16(this.offset, true);
    this.offset += 2;
    return val;
  }

  readUint32() {
    const val = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return val;
  }

  readInt32() {
    const val = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return val;
  }

  readFloat32() {
    const val = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return val;
  }

  readFloat64() {
    const val = this.view.getFloat64(this.offset, true);
    this.offset += 8;
    return val;
  }

  readFixed16(scale = 100) {
    return this.readInt16() / scale;
  }

  readFixed8(scale = 10) {
    return this.readInt8() / scale;
  }

  readString() {
    const len = this.readUint16();
    if (!textDecoder) {
      let str = '';
      for (let i = 0; i < len; i++) {
        str += String.fromCharCode(this.readUint8());
      }
      return str;
    }
    const bytes = new Uint8Array(this.buffer, this.view.byteOffset + this.offset, len);
    this.offset += len;
    return textDecoder.decode(bytes);
  }

  readBytes(length) {
    const bytes = new Uint8Array(this.buffer, this.view.byteOffset + this.offset, length);
    this.offset += length;
    return bytes;
  }

  get bytesRemaining() {
    return this.byteLength - this.offset;
  }
}
