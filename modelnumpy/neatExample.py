import os
from functools import partial
from neat import nn, population, statistics, activation_functions
import cellularAutomaton as ca
import numpy as np

# GUIDE
# initilize game object with some initialState, e.g. cellularAutomaton.initializeHexagonal(), and some parameters, e.g. cellularAutomaton.defaultParameters
# add your species with game.setNewSpecies(index, name, color, energy), only index and name are really needed
# now the iterations start
#       1. get the game state, it's a dict with {cells, neighbors, secondneighbors, futureStates, shape}
#       2. make your decisions for your species by filtering cells, neighbors is an array that can be used as a mask for the cells array
#       2.2 register your decisions with setDecisions(name, ['actions',targetvalue] where actions are valid actions and targetvalues are the neighbor index
#       3. call evolve()

# this is not how you have to make your decisions
# this is just some simple function that makes decisions for species 'Move' and 'Clone'
def makeDecision(state, spec):
    mask = state['cells'][:, 1] == spec
    N = np.sum(mask)
    if N < 1:
        return np.array([])
    dec = np.empty((N, 2),dtype=object)
    dec[:, 0] = 'stay'
    dec[:, 1] = 0
    cells = state['cells'][mask]
    neighbors = state['cells'][np.int_(state['neighbors'][mask])]
    secondneighbors = state['cells'][np.int_(state['secondneighbors'][mask])]

    if spec == 'Move':
        dec[:,0] = 'move'
        dec[:,1] = np.random.randint(0,len(neighbors[0]),N)

    if spec == 'Clone':
        dec[:,0] = 'clone'
        dec[:,1] = np.random.randint(0,len(neighbors[0]),N)

    return dec

def netDecision(state, spec, net):
    mask = state['cells'][:, 1] == spec
    N = np.sum(mask)
    if N < 1:
        return np.array([])
    dec = np.empty((N, 2),dtype=object)
    dec[:, 0] = 'stay'
    dec[:, 1] = 0
    cells = state['cells'][mask]
    neighbors = state['cells'][np.int_(state['neighbors'][mask])]
    secondneighbors = state['cells'][np.int_(state['secondneighbors'][mask])]
    # input will be self.energy, all 6 neighbors as -1,0,1 enemy,empty,friendly, 7 total, 19 if secondneighbors
    neighborvalues = np.zeros(np.shape(neighbors)[:2])
    neighborvalues[(neighbors[:,:,1] != spec) & (neighbors[:,:,1] != 'empty')] = -1
    neighborvalues[neighbors[:,:,1] == spec] = 1
    print(neighborvalues)

    inputs = np.zeros((N,7))
    inputs[:,0] = cells[:,3]
    inputs[:,1:7] = neighborvalues
    print(inputs)
    input.append(cell.state['energy'])
    for n in cell.neighbors:
        if n.state['species'] == 'empty':
            input.append(0)
        elif (n.state['species'] != cell.state['species']) & (n.state['species'] != 'empty'):
            input.append(-1)
        elif n.state['species'] == cell.state['species']:
            input.append(1)
        else:
            print("something wrong with neighbors")
    #output will be -1-1, stay,clone 1-6, move 1-6, fight 1-6
    output = net.activate(input)
    #print(len(input),len(output))
    choice = np.argmax(output)
    if choice == 0:
        return {'action': 'stay', 'value': 0}
    choice = choice -1
    if choice < 6:
        return {'action': 'clone', 'value': choice}
    choice = choice - 6
    if choice < 6:
        return {'action': 'move', 'value': choice}
    choice = choice - 6
    if choice < 6:
        return {'action': 'fight', 'value': choice}
    print("something wrong with output")
    return {'action': 'stay', 'value': 0}

def countSpecies(state,spec):
    return np.sum(state['cells'][:,1] == spec)

#this is a fitness function for trainig single genomes alone
def eval_fitness_single(genomes):
    #multiple fights make for better statistics
    num_runs = 1
    for g in genomes:
        net = nn.create_recurrent_phenotype(g)
        achi = 0
        for _ in range(num_runs):
            mooreNeighborhood = ca.Neighborhood(gocl.initNeighborhood)
            gameOfLife = ca.CellularAutomaton(mooreNeighborhood)
            gameOfLife.parameters = gameOfLife.world['parameters']
            newSpecies(gameOfLife, {'species': 'test', 'color': 'Blue', 'position': {'x': 0, 'y': 0}})
            currentDecision = partial(netDecision, net=net)
            evolve = gameOfLife.evolve
            c = 0
            while c < 20:
                dec = {}
                recursionDecision(gameOfLife.world['space'],dec,currentDecision)
                gameOfLife.decisions = dec
                evolve()
                c += 1
            achi += countSpecies(gameOfLife.world['space'],'test')
        g.fitness = achi / num_runs

#this is a fitness function for training genomes by letting them play on a common field
def eval_fitness_internalfight(allgenomes):
    num_runs = 2
    for g in allgenomes:
        g.fitness = 0
    #sadly, the number of genomes from neat-python is not fixed, so we only train some to fit %4
    genomes = allgenomes[:int(len(allgenomes)/4)*4]
    print(len(allgenomes),len(genomes))
    for _ in range(num_runs):
        #geht nur, wenn genomes durch 4 teilbar ist
        grouping = np.reshape(np.random.permutation(len(genomes)),(len(genomes)/4,4))
        for group in grouping:
            nets = []
            game = ca.CellularAutomaton(initialState=ca.initializeHexagonal(10,10),param=ca.defaultParameters)
            for i,g in enumerate(group):
                nets.append(nn.create_recurrent_phenotype(genomes[g]))
                game.setNewSpecies(i*25, i, 0)
            while game.turn < 30:
                for i,g in enumerate(group):
                    try:
                        game.setDecisions(netDecision(game.getState(),i,net[i]))
                    except:
                        pass
                game.evolve()
            for i,g in enumerate(group):
                genomes[g].fitness += countSpecies(game.getState(),i)
    #results of fights define the fitness
    for g in genomes:
        g.fitness = g.fitness / num_runs

#adding elu to activation functions
def elu(x):
    return x if x < 0 else np.exp(x)-1
activation_functions.add('elu', elu)

def main():
    print("Starting...")
    pop = population.Population(os.path.join(os.path.dirname(__file__), 'nn_config'))
    #HINT change checkpoints for new try or reloading
    try:
        pop.load_checkpoint(os.path.join(os.path.dirname(__file__), 'checkpoints/popv1.cpt'))
    except:
        pass
    pop.run(eval_fitness_internalfight, 5)
    pop.save_checkpoint(os.path.join(os.path.dirname(__file__), 'checkpoints/popv1.cpt'))

    statistics.save_stats(pop.statistics)
    statistics.save_species_count(pop.statistics)
    statistics.save_species_fitness(pop.statistics)

    winner = pop.statistics.best_genome()
    print('\nBest genome:\n{!s}'.format(winner))
    print('\nOutput:')
    winner_net = nn.create_recurrent_phenotype(winner)
    game = ca.CellularAutomaton(initialState=ca.initializeHexagonal(10,10),param=ca.defaultParameters)
    game.setNewSpecies(0, 'winner', 0)
    while game.turn < 30:
        game.setDecisions(netDecision(state,i,net[i]))
        evolve()
    print("Ended with: ",countSpecies(game.getState(),'winner'))
    print(game.cells[game.cells[:,1] != 'empty',:4])

if __name__ == "__main__":
    main()
