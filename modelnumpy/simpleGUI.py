#!/usr/bin/python3
# -*- coding: utf-8 -*-


import sys
from PyQt5.QtWidgets import QApplication, QMainWindow, QLabel
from PyQt5.QtGui import QIcon, QPixmap, QPainter
from PyQt5.QtCore import Qt
from PyQt5 import uic


class SimpleGUI(QMainWindow):
    
    def __init__(self, pics):
        super().__init__()
        uic.loadUi('simpleGUI.ui', self)    
        self.scrollAreaWidgetContents = QLabel()
        self.scrollArea.setWidget(self.scrollAreaWidgetContents)
        self.spinBox.setMinimum(0)
        self.spinBox.setMaximum(len(pics)-1)  
        self.pics = pics
        self.pixmaps =[QPixmap(a) for a in self.pics] 
        self.spinBox.valueChanged.connect(self.boardUpdate)
        self.spinBox.setValue(0)
        self.backButton.clicked.connect(self.backClicked)
        self.nextButton.clicked.connect(self.nextClicked)
        
    def resizeEvent(self,resizeEvent):
        self.boardUpdate()
        
    def showEvent(self, showEvent):
        self.boardUpdate()
        
        
    def backClicked(self):
        if self.spinBox.value == 0:
            return
        else:
            self.spinBox.setValue(self.spinBox.value() -1)
            self.boardUpdate()
    
    def nextClicked(self):
        if self.spinBox.value == len(self.pics)-1:
            return
        else:
            self.spinBox.setValue(self.spinBox.value() + 1)
            self.boardUpdate()
            
    def boardUpdate(self):
        i = self.spinBox.value()
        label = self.scrollAreaWidgetContents
        pixmap = self.pixmaps[i].scaled(self.scrollArea.size(), Qt.KeepAspectRatio, transformMode = Qt.SmoothTransformation)
        self.scrollAreaWidgetContents.setPixmap(pixmap) 
        
                
if __name__ == '__main__':
    pass
