import pyautogui
import time
import random

class Clicker:
    def __init__(self):
        # Safety settings
        pyautogui.PAUSE = 0.5
        pyautogui.FAILSAFE = True # Move mouse to corner to abort

    def click_at(self, x, y, jitter=5):
        """Click at a position with a small random offset to mimic human behavior."""
        target_x = x + random.randint(-jitter, jitter)
        target_y = y + random.randint(-jitter, jitter)
        
        print(f"Moving to ({target_x}, {target_y}) and clicking...")
        pyautogui.moveTo(target_x, target_y, duration=random.uniform(0.2, 0.5))
        pyautogui.click()

    def scroll(self, amount):
        pyautogui.scroll(amount)

    def wait(self, seconds):
        time.sleep(seconds)
