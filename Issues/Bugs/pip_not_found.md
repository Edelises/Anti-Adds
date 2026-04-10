# Issue: `pip` command not found

## Description
When attempting to install dependencies using `pip install ...`, the command failed with `zsh:1: command not found: pip`.

## Impact
Unable to install required libraries (`opencv-python`, `pyautogui`, etc.).

## Investigation
The system has `python3` installed, but `pip` is not mapped to the global path or is available via the module flag.
