# GitHub SSH Keys Setup

## 1. Generate SSH Key Pair

```powershell
ssh-keygen -t ed25519 -C "your-email@example.com"
```

Press Enter when prompted for file location (saves to `~/.ssh/id_ed25519`) and optionally set a passphrase.

## 2. Add Key to SSH Agent

```powershell
# Start the SSH agent
Get-Service ssh-agent | Start-Service

# Add your key
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

## 3. Copy Public Key to Clipboard

```powershell
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub | Set-Clipboard
```

## 4. Add to GitHub

- Go to https://github.com/settings/keys
- Click "New SSH key"
- Paste the key (already in clipboard)
- Give it a title and save

## 5. Test Connection

```powershell
ssh -T git@github.com
```

You should see: `Hi username! You've successfully authenticated, but GitHub does not provide shell access.`

## Next Steps

After this, you can use SSH URLs for git operations:

```bash
git clone git@github.com:username/repo.git
```
