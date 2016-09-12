from functools import partial
from neat import nn, population, statistics, activation_functions
import cellularAutomaton as ca
import numpy as np
import argparse
from functools import partial

import os, glob, sys
#from util import *  # HexagonGenerator,SaveStatePicture,sort_nicely
import util

sys.path.insert(0, '../')
from PyQt5.QtWidgets import QApplication
from simpleGUI import SimpleGUI

# GUIDE
# initilize game object with some initialState, e.g. cellularAutomaton.initializeHexagonal(), and some parameters, e.g. cellularAutomaton.defaultParameters
# add your species with game.setNewSpecies(index, name, color, energy), only index and name are really needed
# now the iterations start
#       1. get the game state, it's a dict with {cells, neighbors, secondneighbors, futureStates, shape}
#       2. make your decisions for your species by filtering cells, neighbors is an array that can be used as a mask for the cells array
#       2.2 register your decisions with setDecisions(name, ['actions',targetvalue] where actions are valid actions and targetvalues are the neighbor index
#       3. call evolve()

def netDecision(state, spec, net):
    mask = state['cells'][:, 1] == spec
    N = np.sum(mask)
    if N < 1:
        return np.array([])
    dec = np.empty((N, 2), dtype=object)
    dec[:, 0] = 'stay'
    dec[:, 1] = 0
    cells = state['cells'][mask]
    neighbors = state['cells'][np.int_(state['neighbors'][mask])]
    secondneighbors = state['cells'][np.int_(state['secondneighbors'][mask])]
    # input will be self.energy, all 6 neighbors as -1,0,1 enemy,empty,friendly, then energies, 13 total, 19 if secondneighbors
    neighborvalues = np.zeros(np.shape(neighbors)[:2])
    neighborvalues[(neighbors[:, :, 1] != spec) & (neighbors[:, :, 1] != 'empty')] = -1
    neighborvalues[neighbors[:, :, 1] == spec] = 1
    neighborenergies = neighbors[:, :, 3]

    inputs = np.zeros((N, 13))
    inputs[:, 0] = cells[:, 3]
    inputs[:, 1:7] = neighborvalues
    inputs[:, 7:13] = neighborenergies
    # output will be stay, wall, clone 1-6, move 1-6, fight 1-6, infuse 1-6: 26 total
    outputs = np.zeros((N, 26))
    for i in range(N):
        outputs[i] = net.serial_activate(inputs[i])
        # outputs[i] = net.activate(inputs[i])

    choices = np.argmax(outputs, axis=1)
    actions = np.empty((len(choices), 2), dtype='object')
    actions[:, 0] = 'stay'
    actions[:, 1] = 0

    actions[choices == 0] = [['stay', 0]]
    actions[choices == 1] = [['wall', 0]]
    mask = (choices > 1) & (choices < 8)
    actions[mask, 0] = 'clone'
    actions[mask, 1] = choices[mask] - 2
    mask = (choices > 7) & (choices < 14)
    actions[mask, 0] = 'move'
    actions[mask, 1] = choices[mask] - 8
    mask = (choices > 13) & (choices < 20)
    actions[mask, 0] = 'fight'
    actions[mask, 1] = choices[mask] - 14
    mask = (choices > 19) & (choices < 26)
    actions[mask, 0] = 'infuse'
    actions[mask, 1] = choices[mask] - 20
    return actions


def countSpecies(state, spec):
    return np.sum(state['cells'][:, 1] == spec)


# this is a fitness function for training genomes by letting them play on a common field
# since genome count is not constant we have to pad when training
# since defaultstagnation does not work with this the worst genomes get fitness of 0
# this will mean that if a genome is part of the worst ones for too long it is stagnated
def eval_fitness_internalfight(allgenomes, num_runs=3, steplength=100, x=16, y=16):
    for g in allgenomes:
        g.fitness = 0
    # sadly, the number of genomes from neat-python is not fixed, so we only train some to fit %4
    topad = int(np.ceil(len(allgenomes)/4)*4-len(allgenomes))
    traincount = np.zeros(len(allgenomes))
    trainfitness = np.zeros(len(allgenomes))
    print(len(allgenomes),topad)
    for _ in range(num_runs):
        # geht nur, wenn genomes durch 4 teilbar ist TODO change this
        grouping = np.random.permutation(len(allgenomes))
        if topad > 0:
            grouping = np.concatenate((grouping, np.random.choice(grouping,topad)))

        grouping = np.reshape(grouping, (len(grouping)/4, 4))
        for group in grouping:
            nets = []
            game = ca.CellularAutomaton(initialState=ca.initializeHexagonal(x, y), param=ca.defaultParameters)
            for i, g in enumerate(group):
                nets.append(nn.create_feed_forward_phenotype(allgenomes[g]))
                game.setNewSpecies(util.nicePositions4(i,x,y), 'spec' + str(i))
            while game.step < steplength:
                state = game.getState()
                for j, g in enumerate(group):
                    game.setDecisions('spec' + str(j), netDecision(state, 'spec' + str(j), nets[j]))
                game.evolve()
            for k, g in enumerate(group):
                trainfitness[g] += countSpecies(game.getState(), 'spec' + str(k))
                traincount[g] += 1
    # divide training results by traincount, bc of padding etc this has to be done
    # fitness of all below median is set to zero
    trainfitness = trainfitness/traincount
    trainfitness[trainfitness < np.median(trainfitness)] = 0

    # results of fights define the fitness
    for k, g in enumerate(allgenomes):
        g.fitness = trainfitness[k]


# adding elu to activation functions
def elu(x):
    return x if x < 0 else np.exp(x) - 1


activation_functions.add('elu', elu)


def train(checkpoint, config):
    print("Starting...")
    pop = population.Population(config)
    # HINT change checkpoints for new try or reloading
    try:
        pop.load_checkpoint(checkpoint)
    except:
        print("Checkpoint not found, starting from scratch: ", checkpoint)
    trainfunc = partial(eval_fitness_internalfight, num_runs=4, steplength=100, x=16, y=16)
    pop.run(trainfunc, 20)
    pop.save_checkpoint(checkpoint)

    statistics.save_stats(pop.statistics)
    statistics.save_species_count(pop.statistics)
    statistics.save_species_fitness(pop.statistics)

    winner = pop.statistics.best_genome()
    print('\nBest genome:\n{!s}'.format(winner))


def visualizeWinners(checkpoint, config, picdir, rounds):
    colors = ['red', 'yellow', 'green', 'blue']
    while len(checkpoint) < 4:
        checkpoint.extend(checkpoint)
    checkpoint = checkpoint[:4]
    print("Going to let fight: ", checkpoint)
    print("With colors: ", colors)
    nets = {}
    for i, c in enumerate(checkpoint):
        pop = population.Population(config)
        pop.load_checkpoint(c)
        trainfunc = partial(eval_fitness_internalfight, num_runs=10, steplength=200, x=16, y=16)
        pop.run(trainfunc, 1)
        winner = pop.statistics.best_genome()
        nets[c+str(i)] = nn.create_feed_forward_phenotype(winner)

    filelist = glob.glob(os.path.join(picdir, 'step*.png'))
    for f in filelist:
        os.remove(f)

    x = 40; y = 40
    game = ca.CellularAutomaton(initialState=ca.initializeHexagonal(x, y), param=ca.defaultParameters)
    for i,k in enumerate(nets.keys()):
        game.setNewSpecies(util.nicePositions4(i,x, y), k, colors[i])

    util.saveStatePicture(game.getState(), picdir)

    while game.step < rounds:
        state = game.getState()
        for s in game.findSpecies():
            try:
                game.setDecisions(s, netDecision(state, s, nets[s]))
            except:
                pass
        game.evolve()
        util.saveStatePicture(state, picdir)

    app = QApplication(sys.argv)
    pics = util.sort_nicely(glob.glob(os.path.join(picdir, 'step*.png')))
    gui = SimpleGUI(pics)

    gui.show()
    sys.exit(app.exec_())


# ===============================================================================
def main():
    parser = argparse.ArgumentParser(description='Train or let play NNs with neat')
    parser.add_argument('-f', default=False, action='store_true', help='show a fight')
    parser.add_argument('-t', default=False, action='store_true', help='train the population')
    parser.add_argument('-g', default=1, type=int,
                        help='generations to train, will be multiplied by 20, checkpoints are saved after 20 generations')
    parser.add_argument('-r', default=1000, type=int, help='rounds to fight')
    parser.add_argument('-p', default='pics/', help='directory for the pics of the fight')
    parser.add_argument('-c', default=['checkpoints/somepop.cpt'], type=str, nargs='+', help='checkpoint file to use, save and load')
    parser.add_argument('-C', default='nn_config', type=str,
                        help='config file to use, should fit the netDecision function')

    args = parser.parse_args()

    FIGHTFLAG = args.f
    TRAINFLAG = args.t
    TRAINGENS = args.g
    FIGHTROUNDS = args.r
    PICDIR = args.p
    CHECKPOINT = args.c
    CONFIG = args.C

    if (TRAINFLAG == False) & (FIGHTFLAG == False):
        print("Both flags are False, use -f or -t to fight or train!")
    if TRAINFLAG:
        print("Starting training, saving in ", CHECKPOINT[0])
        for _ in range(TRAINGENS):
            train(CHECKPOINT[0], CONFIG)
    if FIGHTFLAG:
        print("Letting average winner (red) and 3 others fight, saving in ", PICDIR)
        visualizeWinners(CHECKPOINT, CONFIG, PICDIR, FIGHTROUNDS)


if __name__ == "__main__":
    main()
