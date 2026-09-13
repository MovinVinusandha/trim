import sys

with open('tailwind.config.js', 'r') as f:
    config = f.read()

# Add keyframes and animation if not present
if "infinite-scroll-x" not in config:
    config = config.replace(
        "keyframes: {", 
        "keyframes: {\n        'infinite-scroll-x': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },"
    )
    config = config.replace(
        "animation: {", 
        "animation: {\n        'infinite-scroll-x': 'infinite-scroll-x 40s linear infinite',"
    )

    with open('tailwind.config.js', 'w') as f:
        f.write(config)
    print("tailwind.config.js updated!")
else:
    print("already has infinite-scroll-x")
