# less-2-css

Automatically convert those `.less` file which is **not using less function** to `.css`.

## Why

Less is a powerful CSS pre-processor, but it also very slow. We want use it only when we
need it.

## Usage

```
pnpm build
pnpm start /path/to/your/project
```

## How it works

1. Scan all files in the project.
2. Once found a `.less` file, use [postcss](https://github.com/postcss/postcss) to convert
   it to css file.
3. Validate the css file with [csstree-validator](https://github.com/csstree/validator).
4. If it is valid, this file can be safely rename to `.css`.
5. Modify the import path in `.js`, `.jsx`, `.ts`, `.tsx` file from `.less` to `.css`.

## Example

You can see this example in `/test/example`.

### Before

![](https://img.alicdn.com/imgextra/i2/O1CN01pwv2cI1ntphJBOPhP_!!6000000005148-2-tps-462-450.png)

![](https://img.alicdn.com/imgextra/i2/O1CN01w79Tw81o5HbMf6KRg_!!6000000005173-2-tps-1110-678.png)

### After

![](https://img.alicdn.com/imgextra/i4/O1CN01DGJiHz1rZuwOskzm1_!!6000000005646-2-tps-434-446.png)

![](https://img.alicdn.com/imgextra/i4/O1CN01AIphqy1NyFVfCv6fl_!!6000000001638-2-tps-1050-666.png)
