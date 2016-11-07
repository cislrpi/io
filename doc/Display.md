#Display

Display API enables remotely managing content on the displays driven by **[electron](http://electron.atom.io/) based [display-workers](https://github.ibm.com/celio/display-worker)**. 


`io.displayContext` is a singleton object in the CELIO library. It helps to create, activate and manipulate display contexts.

##Basics

Typically, an application has a single **display context**. However, an application can create and manage as many display contexts as needed.
 

By default, a display context has a window per display (display-worker) as below. Here, the display names are used for window names and display bounds are used as the size of these windows. ViewObjects are created within these windows.

![Display Context](display-simple.png)
*Figure 1. Default window setup for a display context.*

More advanced settings are available to define windows within each display worker in a display context.
![Display Context](display-multi.png)
*Figure 2. Advanced window setup for a display context.*

 