import math
import os
from PIL import Image, ImageDraw, ImageFilter
import re
import numpy as np


def tryint(s):
    try:
        return int(s)
    except:
        return s


def alphanum_key(s):
    return [tryint(c) for c in re.split('([0-9]+)', s)]


def sort_nicely(l):
    return sorted(l, key=alphanum_key)


class HexagonGenerator(object):
    """Returns a hexagon generator for hexagons of the specified size."""

    def __init__(self, edgeLength):
        self.edgeLength = edgeLength
        self.offsetX = 2
        self.offsetY = 2+edgeLength / 2

    def __call__(self, row, col):
        if row % 2 == 0:
            x = self.offsetX
        else:
            x = self.offsetX + self.edgeLength * math.sqrt(3) / 2
        y = self.offsetY
        x += self.edgeLength * col * math.sqrt(3)
        y += self.edgeLength * 1.5 * row

        ret = []
        for angle in range(-30, 330, 60):
            x += math.cos(math.radians(angle)) * self.edgeLength
            y += math.sin(math.radians(angle)) * self.edgeLength
            ret.append((x, y))
        return ret


def saveStatePicture2(state,path):
    edge = 32
    size = (int(state['shape'][1]*3**.5*edge+edge)),(int(state['shape'][0]*1.5*edge+edge))
    hexagon_generator = HexagonGenerator(2*edge)
    colors = np.reshape(state['cells'][:, 2], state['shape'])
    image = Image.new('RGB', (2*size[0],2*size[1]), 'white')
    draw = ImageDraw.Draw(image)
    for i in range(len(colors)):
        for j in range(len(colors[0])):
            hexagon = hexagon_generator(i, j)
            draw.polygon(hexagon, outline='black', fill=colors[i, j])
    image.thumbnail(size)
    image.save(path)

def saveStatePicture(state, directory):
    edge = 32
    size = (int(state['shape'][1]*3**.5*edge+edge)),(int(state['shape'][0]*1.5*edge+edge))
    if not os.path.exists(directory):
        os.makedirs(directory)
    hexagon_generator = HexagonGenerator(2*edge)
    colors = np.reshape(state['cells'][:, 2], state['shape'])
    image = Image.new('RGB', (2*size[0],2*size[1]), 'white')
    draw = ImageDraw.Draw(image)
    for i in range(len(colors)):
        for j in range(len(colors[0])):
            hexagon = hexagon_generator(i, j)
            draw.polygon(hexagon, outline='black', fill=colors[i, j])
    image.thumbnail(size)   
    image.save(directory + '/step' + str(state['step']) + '.png')

def nicePositions4(i,x,y):
    temp = np.reshape(np.arange(x*y),(x,y))
    return temp[(i*(x//4)+x//4)%x, (i*(y//2)+y//4)%y]
