import unittest
import cellularAutomaton as ca
import numpy as np

class TestStringMethods(unittest.TestCase):

    def setUp(self):
        self.game = ca.CellularAutomaton(initialState=ca.initializeHexagonal(3,3),param=ca.defaultParameters)
        self.state = self.game.getState()
        self.game.setNewSpecies(0, 'Move', 'blue', 20)
        self.state['cells'][0,1] = 'Move'
        self.state['cells'][0,2] = 'blue'
        self.state['cells'][0,3] = 20

    def test_newSpecies(self):
        self.game.setNewSpecies(6, 'Clone', 'grey', 2.3)
        self.state['cells'][6,1] = 'Clone'
        self.state['cells'][6,2] = 'grey'
        self.state['cells'][6,3] = 2.3
        self.assertTrue(np.all(self.state['cells'] == self.game.getState()['cells']))

    def test_energy(self):
        self.game.evolve()
        self.state['cells'][0,3] = 25
        self.assertTrue(np.all(self.state['cells'] == self.game.getState()['cells']))

    def test_move(self):
        self.game.setDecisions('Move',[['move',3]])
        self.game.evolve()
        self.state['cells'][1,1] = 'Move'
        self.state['cells'][1,2] = 'blue'
        self.state['cells'][1,3] = 24
        self.state['cells'][0,1] = 'empty'
        self.state['cells'][0,2] = 'white'
        self.state['cells'][0,3] = 0
        self.assertTrue(np.all(self.state['cells'] == self.game.getState()['cells']))

    def test_clone(self):
        self.game.setDecisions('Move',[['clone',3]])
        self.game.evolve()
        self.state['cells'][1,1] = 'Move'
        self.state['cells'][1,2] = 'blue'
        self.state['cells'][1,3] = 15
        self.state['cells'][0,3] = 15
        self.assertTrue(np.all(self.state['cells'] == self.game.getState()['cells']))

    def test_fight(self):
        self.game.setNewSpecies(1, 'tokill', 'red', 10)
        self.state = self.game.getState()
        self.game.setDecisions('Move',[['fight',3]])
        self.game.evolve()
        self.state['cells'][1,1] = 'empty'
        self.state['cells'][1,2] = 'black'
        self.state['cells'][1,3] = 0
        self.state['cells'][0,3] = 22
        self.assertTrue(np.all(self.state['cells'] == self.game.getState()['cells']))

    def test_miss(self):
        self.game.setDecisions('Move',[['fight',3]])
        self.game.evolve()
        self.state['cells'][0,3] = 22
        self.assertTrue(np.all(self.state['cells'] == self.game.getState()['cells']))

    def test_exert(self):
        self.game.setNewSpecies(1, 'dumb', 'red', 10)
        self.state = self.game.getState()
        self.game.setDecisions('Move',[['stay',3]])
        self.game.setDecisions('dumb',[['clone',3]])
        self.game.evolve()
        self.state['cells'][1,1] = 'empty'
        self.state['cells'][1,2] = 'black'
        self.state['cells'][5,2] = 'black'
        self.state['cells'][1,3] = 0
        self.state['cells'][0,3] = 25
        self.assertTrue(np.all(self.state['cells'] == self.game.getState()['cells']))

    def test_notenougheng(self):
        self.game.cells[0,3] = 7
        self.state = self.game.getState()
        self.game.setDecisions('Move',[['clone',3]])
        self.game.evolve()
        self.state['cells'][0,3] = 12
        self.assertTrue(np.all(self.state['cells'] == self.game.getState()['cells']))

    def test_evade(self):
        #print('########################')
        self.game.setNewSpecies(1, 'tokill', 'red', 10)
        self.state = self.game.getState()
        self.game.setDecisions('Move',[['fight',3]])
        self.game.setDecisions('tokill',[['move',3]])
        self.game.evolve()
        self.state['cells'][1,1] = 'empty'
        self.state['cells'][1,2] = 'white'
        self.state['cells'][1,3] = 0
        self.state['cells'][5,1] = 'tokill'
        self.state['cells'][5,2] = 'red'
        self.state['cells'][5,3] = 13
        self.state['cells'][0,3] = 22
        #print(self.game.getState()['cells'])
        #print(self.state['cells'])
        #print('########################')
        self.assertTrue(np.all(self.state['cells'] == self.game.getState()['cells']))

    def test_contested(self):
        print('########################')
        self.game.setNewSpecies(5, 'toMove', 'red', 20)
        self.state = self.game.getState()
        self.state2 = self.game.getState()
        self.game.setDecisions('Move',[['move',3]])
        self.game.setDecisions('toMove',[['move',4]])
        self.game.evolve()
        self.state['cells'][0,1] = 'empty'
        self.state['cells'][0,2] = 'white'
        self.state['cells'][0,3] = 0
        self.state['cells'][1,1] = 'Move'
        self.state['cells'][1,2] = 'blue'
        self.state['cells'][1,3] = 23
        self.state['cells'][5,1] = 'toMove'
        self.state['cells'][5,2] = 'red'
        self.state['cells'][5,3] = 23

        self.state2['cells'][0,1] = 'Move'
        self.state2['cells'][0,2] = 'blue'
        self.state2['cells'][0,3] = 23
        self.state2['cells'][1,1] = 'toMove'
        self.state2['cells'][1,2] = 'red'
        self.state2['cells'][1,3] = 23
        self.state2['cells'][5,1] = 'empty'
        self.state2['cells'][5,2] = 'white'
        self.state2['cells'][5,3] = 0
        print(self.game.getState()['cells'])
        print(self.state['cells'])
        print(self.state2['cells'])
        print('########################')
        self.assertTrue((np.all(self.state['cells'] == self.game.getState()['cells'])) | (np.all(self.state2['cells'] == self.game.getState()['cells'])))


if __name__ == '__main__':
    unittest.main()
