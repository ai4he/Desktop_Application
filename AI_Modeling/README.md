## README file for HAIE-88-AI 

the first code segment is for classifying a dataset of apps based on various categories, such as developer, ratings, etc. 

  to use, edit line 10 ("df = pd.read_csv ...) and include the desired dataset as a .csv file
  the code should then run and display the output including: rating distribution, top 10 
  categories by number of apps in the ranking, correlation between star rating and # of   
  downloads, apps with the most downloads, top 10 developers by number of apps in ranking, and 
  top 10 developers by # of downloads 

the second segment is for filtering classification cases that do not have a match with pre-labeled categories 

  to run, replace line 4 with the location and name of the desired dataset as a .csv file.  
  Replace line 5 with the desired dataset to compare it to. 
  the code should then run and display "empty dataframe" to indicate data that does not match   
  between the datasets
  
the third segment is for infering data categories that do not match pre-labeled lists using text classification 

  to run, first run section 0 to set. up the environment
  then run section 3, an application classification model, to perform the intended  
  classification
