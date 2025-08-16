#!/usr/bin/env python3
import csv
from collections import defaultdict

# Read CSV file
results = []
with open('navigation-test-report-2025-08-16_1.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        results.append(row)

# Calculate statistics per layout
layout_stats = defaultdict(lambda: {
    'total': 0,
    'passed': 0,
    'failed': 0,
    'by_direction': defaultdict(lambda: {'total': 0, 'passed': 0, 'failed': 0}),
    'failure_types': {'unexpected': 0, 'missing': 0, 'wrong_target': 0}
})

for row in results:
    layout = row['Layout']
    direction = row['Direction']
    status = row['Status']
    expected = row['Expected']
    actual = row['Actual']
    
    stats = layout_stats[layout]
    stats['total'] += 1
    stats['by_direction'][direction]['total'] += 1
    
    if status == 'PASS':
        stats['passed'] += 1
        stats['by_direction'][direction]['passed'] += 1
    else:
        stats['failed'] += 1
        stats['by_direction'][direction]['failed'] += 1
        
        # Categorize failure type
        if expected == 'null' and actual != 'null':
            stats['failure_types']['unexpected'] += 1
        elif expected != 'null' and actual == 'null':
            stats['failure_types']['missing'] += 1
        else:
            stats['failure_types']['wrong_target'] += 1

# Print results
print('=' * 80)
print('                     NAVIGATION TEST RESULTS ANALYSIS')
print('=' * 80)
print()

# Overall summary
total_tests = sum(s['total'] for s in layout_stats.values())
total_passed = sum(s['passed'] for s in layout_stats.values())
total_failed = sum(s['failed'] for s in layout_stats.values())

print('OVERALL SUMMARY')
print('-' * 15)
print(f"Total Tests:     {total_tests}")
print(f"Total Passed:    {total_passed} ({total_passed/total_tests*100:.1f}%)")
print(f"Total Failed:    {total_failed} ({total_failed/total_tests*100:.1f}%)")
print()
print('=' * 80)
print()

# Per-layout statistics
for layout in sorted(layout_stats.keys()):
    stats = layout_stats[layout]
    success_rate = stats['passed'] / stats['total'] * 100 if stats['total'] > 0 else 0
    
    print(f"LAYOUT: {layout.upper()}")
    print('─' * 40)
    print(f"Total Tests:     {stats['total']}")
    print(f"Passed:          {stats['passed']} ({success_rate:.1f}%)")
    print(f"Failed:          {stats['failed']} ({100-success_rate:.1f}%)")
    
    print("\nBy Direction:")
    for direction in ['up', 'down', 'left', 'right']:
        dir_stats = stats['by_direction'][direction]
        if dir_stats['total'] > 0:
            dir_rate = dir_stats['passed'] / dir_stats['total'] * 100
            print(f"  {direction:6} - Total: {dir_stats['total']:2}, "
                  f"Passed: {dir_stats['passed']:2} ({dir_rate:5.1f}%), "
                  f"Failed: {dir_stats['failed']:2}")
    
    print("\nFailure Analysis:")
    print(f"  Unexpected Navigation:  {stats['failure_types']['unexpected']} (expected null but got navigation)")
    print(f"  Missing Navigation:     {stats['failure_types']['missing']} (expected navigation but got null)")
    print(f"  Wrong Target:           {stats['failure_types']['wrong_target']} (navigated to wrong node)")
    print()

# Comparison table
print('=' * 80)
print('                           LAYOUT COMPARISON TABLE')
print('=' * 80)
print()
print('Layout              | Success Rate | Up      | Down    | Left    | Right   |')
print('--------------------+--------------+---------+---------+---------+---------|')

for layout in sorted(layout_stats.keys()):
    stats = layout_stats[layout]
    overall_rate = stats['passed'] / stats['total'] * 100 if stats['total'] > 0 else 0
    
    dir_rates = []
    for direction in ['up', 'down', 'left', 'right']:
        dir_stats = stats['by_direction'][direction]
        if dir_stats['total'] > 0:
            rate = dir_stats['passed'] / dir_stats['total'] * 100
            dir_rates.append(f"{rate:5.1f}%")
        else:
            dir_rates.append("  N/A ")
    
    print(f"{layout:19} | {overall_rate:11.1f}% | {dir_rates[0]:7} | {dir_rates[1]:7} | {dir_rates[2]:7} | {dir_rates[3]:7} |")

print()
print('=' * 80)