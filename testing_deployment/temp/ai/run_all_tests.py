"""
Master Test Runner for SwipeX Intern 3 AI/ML Career Intelligence Service.
Runs test suites for Day 2-3, Day 4-5, and Day 6 deliverables.
"""

import sys
import unittest

def main():
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Discover and add all test modules
    suite.addTests(loader.discover(start_dir='.', pattern='test_day*.py'))
    suite.addTests(loader.discover(start_dir='tests', pattern='test_*.py'))
    suite.addTests(loader.discover(start_dir='tests', pattern='test_day*.py'))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    if not result.wasSuccessful():
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()
