import os
from functools import partial
from neat import nn, population, statistics, activation_functions
import gameOfComplexLife as gocl
import cellularAutomaton as ca
import numpy as np

def netDecision(cell, net):
    # input will be self.energy, all 6 neighbors as -1,0,1 enemy,empty,friendly
    input = []
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

def newSpecies(game, event):
    game.decisions[event['species']] = []

    def func():
        return {'color': event['color'], 'species': event['species'], 'energy': 0}

    newCell = ca.Cell(func)
    game.world['space'][event['position']['x']][event['position']['y']].state = newCell.state
    game.world['space'][event['position']['x']][event['position']['y']].futureState = newCell.futureState

def countSpecies(space,species):
    count = {}
    def func(cell):
        return cell.state['species'] == species
    recursionDecision(space,count,func)
    try:
        return np.sum(np.array(count[species]))
    except:
        return 0


# ===================HIER BEGINNT DAS BEISPIEL================

def recursionDecision(level, output, func):
    if isinstance(level, list):
        for l in level:
            recursionDecision(l, output,func)
    elif str(type(level)) == "<class 'cellularAutomaton.Cell'>":  # TODO unschön
        try:
            output[level.state['species']].append(func(level))
        except:
            output[level.state['species']] = [func(level)]
    else:
        print('elemental cell should be an object, but is:' + str(type(level)))  # console.log in js


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
            mooreNeighborhood = ca.Neighborhood(gocl.initNeighborhood)
            gameOfLife = ca.CellularAutomaton(mooreNeighborhood)
            gameOfLife.parameters = gameOfLife.world['parameters']
            for i,g in enumerate(group):
                nets.append(nn.create_recurrent_phenotype(genomes[g]))
                newSpecies(gameOfLife, {'species': i, 'color': i, 'position': {'x': int(i%2)*5, 'y': int((i/2)%2)*5}})
            evolve = gameOfLife.evolve
            c = 0
            #length of the game
            while c < 30:
                gameOfLife.decisions = {}
                for i,g in enumerate(group):
                    dec = {}
                    currentDecision = partial(netDecision, net=nets[i])
                    recursionDecision(gameOfLife.world['space'],dec,currentDecision)
                    #if a species died there might be an error
                    try:
                        gameOfLife.decisions[i] = dec[i]
                    except:
                        pass
                evolve()
                c += 1
            for i,g in enumerate(group):
                genomes[g].fitness += countSpecies(gameOfLife.world['space'],i)
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
    pop.load_checkpoint(os.path.join(os.path.dirname(__file__), 'checkpoints/popv1.cpt'))
    pop.run(eval_fitness_internalfight, 5)
    pop.save_checkpoint(os.path.join(os.path.dirname(__file__), 'checkpoints/popv1.cpt'))

    statistics.save_stats(pop.statistics)
    statistics.save_species_count(pop.statistics)
    statistics.save_species_fitness(pop.statistics)

    winner = pop.statistics.best_genome()
    print('\nBest genome:\n{!s}'.format(winner))
    print('\nOutput:')
    winner_net = nn.create_recurrent_phenotype(winner)
    mooreNeighborhood = ca.Neighborhood(gocl.initNeighborhood)
    gameOfLife = ca.CellularAutomaton(mooreNeighborhood)
    gameOfLife.parameters = gameOfLife.world['parameters']
    newSpecies(gameOfLife, {'species': 'test', 'color': 'Blue', 'position': {'x': 0, 'y': 0}})
    currentDecision = partial(netDecision, net=winner_net)
    evolve = gameOfLife.evolve
    c = 0
    while c < 20:
        dec = {}
        recursionDecision(gameOfLife.world['space'],dec,currentDecision)
        gameOfLife.decisions = dec
        evolve()
        c += 1
    print("Ended with: ",countSpecies(gameOfLife.world['space'],'test'))

if __name__ == "__main__":
    main()
