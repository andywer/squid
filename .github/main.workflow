workflow "Build, Test, and Publish" {
  on = "push"
  resolves = ["Publish"]
}

# Filter for a new tag
action "Tag" {
  uses = "actions/bin/filter@master"
  args = "tag"
}

action "Install" {
  uses = "actions/npm@master"
  args = "install"
}

action "Build" {
  needs = "Install"
  uses = "actions/npm@master"
  args = "run build"
}

action "Test" {
  needs = "Install"
  uses = "actions/npm@master"
  args = "test"
}

action "Publish" {
  needs = ["Tag", "Build", "Test"]
  uses = "actions/npm@master"
  args = "publish --access public"
  secrets = ["NPM_AUTH_TOKEN"]
}
