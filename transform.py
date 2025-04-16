import re
import sys


def convert_nested_bullets_to_subheadings(markdown_text):
    lines = markdown_text.splitlines()
    converted_lines = []
    current_heading_level = 0

    for line in lines:
        original_line = line
        line = re.sub('\t', '    ', line, flags=re.DOTALL)
        # Count leading spaces to determine nesting
        leading_spaces = len(line) - len(line.lstrip(' '))
        indent_level = leading_spaces // 4  # assuming 2 spaces per indent

        stripped = line.strip()

        # Heading
        heading_match = re.match(r'^(#{1,7})\s+(.*)', stripped)
        if heading_match:
            current_heading_level = len(heading_match.group(1))
            converted_lines.append(original_line)
            continue

        # Bullet
        bullet_match = re.match(r'^[-*+]\s+(.*)', stripped)
        if bullet_match:
            subheading_level = min(current_heading_level + indent_level + 1, 6)
            content = bullet_match.group(1)
            new_line = f"{'#' * subheading_level} {content}"
            converted_lines.append(new_line)
            continue

        # Other lines
        converted_lines.append(original_line)

    return '\n'.join(converted_lines)

if len(sys.argv) != 2:
    print("Usage: python transform.py file1.md > file2.md")
else:
    with open(sys.argv[1]) as markdown_file:
        markdown_input = markdown_file.read()

    print(convert_nested_bullets_to_subheadings(markdown_input))
