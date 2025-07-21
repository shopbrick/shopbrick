# 🧩 Updating the Codebase

If you’ve forked or cloned **ShopBrick** and are running your own version — for example, with custom products, config, or blog content — you can still receive future updates and improvements from the original repo.

Here’s how:

## 1. Add ShopBrick as the upstream remote

```sh
git remote add upstream https://github.com/shopbrick/shopbrick.git
```

Verify it worked:

```sh
git remote -v
```

This should show both your `origin` (your repo) and the new `upstream` (ShopBrick).

## 2. Fetch the latest changes

```sh
git fetch upstream
```

## 3. Merge updates from ShopBrick `main` into your branch

Make sure you're on your local `main` branch:

```sh
git checkout main
```

Then merge changes:

```sh
git merge upstream/main
```

> 💡 **Note**: If you made changes to core source files, you may need to resolve merge conflicts. Your blog content, products, and `config/` should remain untouched if kept separate.
