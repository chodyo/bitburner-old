# BitBurner Scripts

My collection of scripts for the [BitBurner](https://store.steampowered.com/app/1812820/Bitburner/) game.

Huge thank you to [Naliwe](https://github.com/Naliwe/bitBurnerTsProject) for setting up a TypeScript template repo!

## Bitburner Extension in WSL2 VSCode Note

Because Bitburner now has a fileserver to accept file transfer requests, the file server in this repo is no longer needed. When developing in VSCode on WSL2, an SSH tunnel is required to allow the Bitburner VSCode extension to reach the Bitburner file server running in Windows.

After setting up ssh between Windows/WSL2, I run this command in Windows to open a tunnel to forward requests from the extension to the game server:

```sh
ssh -R 9990:127.0.0.1:9990 {wsl_username}@localhost
```

## Commands

### optimize

Run optimize on `home` to automate manual tasks such as:

- example 1
- example 2
- example 3

```sh
alias optimize="run /bin/optimize"
```
