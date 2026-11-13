#!/usr/bin/env bash
set -euo pipefail

sudo dnf install -y \
  @development-tools \
  pkgconf-pkg-config \
  cmake \
  gtk3-devel \
  webkit2gtk4.1-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  alsa-lib-devel \
  libxkbcommon-devel \
  libxdo-devel \
  gtk-layer-shell-devel \
  clang \
  clang-devel \
  llvm-libs \
  gstreamer1-devel \
  gstreamer1-plugins-base-devel \
  gstreamer1-plugins-bad-free-devel \
  pipewire-devel \
  vulkan-loader-devel \
  vulkan-tools \
  shaderc \
  wtype \
  patchelf \
  rpm-build \
  rpmdevtools
