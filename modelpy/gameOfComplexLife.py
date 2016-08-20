import cellularAutomaton as ca
import numpy as np

CORPSE_COLOR = "black"
EMPTY_COLOR = "white"


def initEmpty():
    return {'color': EMPTY_COLOR, 'species': 'empty', 'energy': 0}


def initNeighborhood():
    world = {}
    space = []
    size = {'x': 5, 'y': 5}

    for i in range(size['x']):
        space.append([])
        for j in range(size['y']):
            space[i].append(ca.Cell(initEmpty))

    # the good modulo (works for negative values also)
    def mod(n, m):
        return ((n % m) + m) % m

    # hexagonal neighboorhood
    for i in range(size['x']):
        for j in range(size['y']):
            # left and right neighbors
            space[i][j].neighbors.append(space[mod(i + 1, size['x'])][j])
            space[i][j].neighbors.append(space[mod(i - 1, size['x'])][j])

            # upper neighbors
            space[i][j].neighbors.append(space[mod(i + j % 2 - 1, size['x'])][mod(j + 1, size['y'])])
            space[i][j].neighbors.append(space[mod(i + j % 2, size['x'])][mod(j + 1, size['y'])])

            # lower neighbors
            space[i][j].neighbors.append(space[mod(i + j % 2 - 1, size['x'])][mod(j - 1, size['y'])])
            space[i][j].neighbors.append(space[mod(i + j % 2, size['x'])][mod(j - 1, size['y'])])

    world['space'] = space

    # this is not in use, but should be!
    world['parameters'] = {

        'energy': {
            'stay': 1,
            'move': 2,
            'fight': 4,
            'clone': 10,
            'wall': 1,
            'fromEmptyCells': 1,
            'fromSun': 0
        }
    }

    return world
