# 🛠️ tools

## CLI

### Installation

```sh
deno --unstable install -An tools https://github.com/han-tyumi/tools/raw/master/mod.ts
```

### Global Options

All [configuration file](#configuration) options are supported by the CLI and will override any options provided by the `tool` global option.

#### --tool \<tool:string>

The name of the tool configuration to use from a [configuration file](#configuration).

#### -h, --help

Shows help information for the tools CLI or a sub-command.

### Commands

#### install [version:string]

Installs a specified tool version.

If no version is provided, the latest downloaded version is used.

```sh
tools install --tool example 1.2.3
```

##### --offline [offline:boolean]

Whether to skip downloading a tool version if it is not found.

#### download \<versions...:string>

Downloads the specified tool versions.

```sh
tools download --tool example 1.0 2.0
```

#### list

Lists the downloaded tool versions.

```sh
tools list --tool example
```

#### latest

Lists the latest downloaded tool version.

```sh
tools latest --tool example
```

#### help [command:command]

Shows help information for the tools CLI or a sub-command.

```sh
tools help install
```

#### completions

Outputs the bash or zsh completions to stdout.

```bash
# ~/.bashrc
source <(tools completions bash)
```

```zsh
# ~/.zshrc
source <(tools completions zsh)
```

## Configuration

You can create a `toolsrc` file within your home directory or the current working directory that is used to define configurations for each tool you wish to manage.

This file can be created using the following languages:

- TypeScript (`toolsrc.ts`)
- JavaScript (`toolsrc.js`)
- YAML (`toolsrc.yaml` or `toolsrc.yml`)

### Options

#### filename

The filename format string to use. A `%s` token will be replaced with the version to be downloaded/installed.

```yaml
example:
  filename: 'example-%s.tar.gz'
```

A function can also be provided when using TypeScript/JavaScript.

```typescript
export const example: InstallerOptions = {
  filename: (version) => `example-${version}.tar.gz`
}
```

#### downloadURL

The download URL format string to use. A `%s` token will be replaced with the version to be downloaded/installed.

```yaml
example:
  downloadURL: 'https://example.com/releases/%s'
```

A function can also be provided when using TypeScript/JavaScript.

```typescript
export const example: InstallerOptions = {
  downloadURL: (version) => `https://example.com/releases/${version}`
}
```

#### versionFmt

The version format to use when installing/downloading tools.

`#`'s are used to denote version number places within a version string.
This enforces a consistent filename and download URL format.

It also allows you to shorten inputted version numbers by adding `0`'s to the missing version number places as well as the suffix and/or prefix if present.

```yaml
example:
  versionFmt: 'v#.#.#' # 1.2 would become v1.2.0
```

#### downloadDir

The directory to store downloaded tool versions.
This can be a relative or absolute path.

```yaml
example:
  downloadDir: 'downloads'
```

#### cache

Whether or not previous tool version downloads should be used.

```yaml
example:
  cache: false
```

#### installFn

The relative or absolute path to a TypeScript/JavaScript file containing a default exported function used to install a downloaded tool version.

Named exports can be used by supplying the exported name after a `#` at the end of the path.

This install function receives the path to the downloaded tool version as an argument.

```yaml
example:
  installFn: 'install.ts#install'
```

Alternatively the install function can be provided itself when using a TypeScript/JavaScript configuration file.

```typescript
export const example: InstallerOptions = {
  installFn: (filepath) => {
    // perform installation
  }
}
```

## Library

Coming Soon
