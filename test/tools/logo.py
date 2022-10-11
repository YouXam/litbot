from PIL import Image
import sys
logo = Image.open(sys.argv[1]).convert('RGBA')
img = Image.open(sys.argv[2])
imageSize = img.size
logoSize = logo.size
logo = logo.resize((int(round(imageSize[0] / 5)), int(round(imageSize[0] / 5 / logoSize[0] * logoSize[1]))))
img.paste(logo, (imageSize[0] - logo.size[0] - 10, 10), mask=logo.split()[3])
img.save('logo_' + sys.argv[2].split('/')[-1])
