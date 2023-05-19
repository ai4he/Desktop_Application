There is two parts to this program:
    1. The first part is the csharp .exe program that keeps track of window open or window closed events on the desktop.
        In this program, everytime one of these events occurs, the event object is written to sqlite database (.sqlite file).
        At the same time, this object is being written to database file, it is writing the same info to myDatabase.csv. This 
        program was written using visual studio community 2022 and selecting .net development project (not the exact name but it was something 
        similar).
    2. The second part of the program is the Electron JS app. When npm start is ran the app is initiated. It has three buttons on
        top of the app: "tracking on/off" button, the "dashboard" button, and the "close" button. When traking is turned on, the .exe 
        program described above will start running. The myDatabase.csv should pop in the main directory of this project. When, the
        "dashboard" button is clicked, the electron app will make a copy of myDatabase.csv file (myDatabaseCopy.csv) and will parse
        the data from that copy and make a bar chart out of that data on the Dashboard page. The electron app was written using VS Code.
        
        i.  myDatabase.csv (and eventually the myDatabaseCopy.csv) does not have any activity name associated with
            each event. I had to manually put those activity names in there and save it as another file, then put that specific file in my
            program to see if the bar chart works
        ii. Furthermore, when the program copies myDatabase.csv, it might not keep the same exact timestamp. To get around this, I would turn
            traking on, then open/close windows, and then close the electron app. I would go into myDatabase.csv and save the data as timestamp type 
            (and label the activities). AFter all of this, I would start the app again and click Dashboard, and it will display the activity times 

        FUTURE PLANS
        ------------

        *The csv file needs activity times, so user or python program needs to label the activities of these events to have data for the electron bar plot.
        *There needs to be some way to write to csv file and specify the type of the data
        *Also the csharp program only includes window open or window closed event so more events need to be coded.