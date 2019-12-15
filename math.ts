type Matrix4_4 = Float32Array;

interface ObjectPool<T> {
  free(obj: T): void;
  malloc(): T;
}

function createMatrix4_4(): Matrix4_4 {
  return new Float32Array(16);
}

function translate4_4(
  m: Matrix4_4,
  x: number,
  y: number,
  z: number,
  op: ObjectPool<Matrix4_4> = createObjectPool(createMatrix4_4)
): Matrix4_4 {
  const t = createTranslation4_4(x, y, z, op);
  const result = multiply4_4(m, t, op);
  op.free(t);
  return result;
}

function scale4_4(
  m: Matrix4_4,
  x: number,
  y: number,
  z: number,
  op: ObjectPool<Matrix4_4> = createObjectPool(createMatrix4_4)
): Matrix4_4 {
  const t = createScaling4_4(x, y, z, op);
  const result = multiply4_4(m, t, op);
  op.free(t);
  return result;
}

function ortho4_4(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number,
  op: ObjectPool<Matrix4_4> = createObjectPool(createMatrix4_4)
): Matrix4_4 {
  const v = op.malloc();
  v[0] = 2 / (right - left);
  v[1] = 0;
  v[2] = 0;
  v[3] = 0;
  v[4] = 0;
  v[5] = 2 / (top - bottom);
  v[6] = 0;
  v[7] = 0;
  v[8] = 0;
  v[9] = 0;
  v[10] = 2 / (near - far);
  v[11] = 0;
  v[12] = (left + right) / (left - right);
  v[13] = (bottom + top) / (bottom - top);
  v[14] = (near + far) / (near - far);
  v[15] = 1;

  return v;
}

function createScaling4_4(
  x: number,
  y: number,
  z: number,
  op: ObjectPool<Matrix4_4> = createObjectPool(createMatrix4_4)
): Matrix4_4 {
  const v = op.malloc();
  v[0] = x;
  v[1] = 0;
  v[2] = 0;
  v[3] = 0;
  v[4] = 0;
  v[5] = y;
  v[6] = 0;
  v[7] = 0;
  v[8] = 0;
  v[9] = 0;
  v[10] = z;
  v[11] = 0;
  v[12] = 0;
  v[13] = 0;
  v[14] = 0;
  v[15] = 1;

  return v;
}

function createTranslation4_4(
  x: number,
  y: number,
  z: number,
  op: ObjectPool<Matrix4_4> = createObjectPool(createMatrix4_4)
): Matrix4_4 {
  const v = op.malloc();
  v[0] = 1;
  v[1] = 0;
  v[2] = 0;
  v[3] = 0;
  v[4] = 0;
  v[5] = 1;
  v[6] = 0;
  v[7] = 0;
  v[8] = 0;
  v[9] = 0;
  v[10] = 1;
  v[11] = 0;
  v[12] = x;
  v[13] = y;
  v[14] = z;
  v[15] = 1;

  return v;
}

function multiply4_4(
  a: Matrix4_4,
  b: Matrix4_4,
  op: ObjectPool<Matrix4_4> = createObjectPool(createMatrix4_4)
): Matrix4_4 {
  const v = op.malloc();
  const b00 = b[0 * 4 + 0];
  const b01 = b[0 * 4 + 1];
  const b02 = b[0 * 4 + 2];
  const b03 = b[0 * 4 + 3];
  const b10 = b[1 * 4 + 0];
  const b11 = b[1 * 4 + 1];
  const b12 = b[1 * 4 + 2];
  const b13 = b[1 * 4 + 3];
  const b20 = b[2 * 4 + 0];
  const b21 = b[2 * 4 + 1];
  const b22 = b[2 * 4 + 2];
  const b23 = b[2 * 4 + 3];
  const b30 = b[3 * 4 + 0];
  const b31 = b[3 * 4 + 1];
  const b32 = b[3 * 4 + 2];
  const b33 = b[3 * 4 + 3];
  const a00 = a[0 * 4 + 0];
  const a01 = a[0 * 4 + 1];
  const a02 = a[0 * 4 + 2];
  const a03 = a[0 * 4 + 3];
  const a10 = a[1 * 4 + 0];
  const a11 = a[1 * 4 + 1];
  const a12 = a[1 * 4 + 2];
  const a13 = a[1 * 4 + 3];
  const a20 = a[2 * 4 + 0];
  const a21 = a[2 * 4 + 1];
  const a22 = a[2 * 4 + 2];
  const a23 = a[2 * 4 + 3];
  const a30 = a[3 * 4 + 0];
  const a31 = a[3 * 4 + 1];
  const a32 = a[3 * 4 + 2];
  const a33 = a[3 * 4 + 3];
  v[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
  v[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
  v[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
  v[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
  v[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
  v[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
  v[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
  v[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
  v[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
  v[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
  v[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
  v[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
  v[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
  v[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
  v[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
  v[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

  return v;
}

function createObjectPool<T>(
  create: () => T,
  initialSize: number = 0
): ObjectPool<T> {
  const pool: T[] = [];

  if (initialSize) {
    for (let i = 0; i < initialSize; i += 1) {
      pool.push(create());
    }
  }

  return {
    free(obj: T) {
      pool.push(obj);
    },
    malloc() {
      if (pool.length) {
        const o = pool.pop();
        if (o) {
          return o;
        }
        return create();
      }
      return create();
    },
  };
}
