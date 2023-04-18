// See https://aka.ms/new-console-template for more information
String on="on";
String off="off";
        
if (!File.Exists(@"C:/Users/mroge/Documents/on.txt") & !File.Exists(@"C:/Users/mroge/Documents/off.txt")){
    File.WriteAllText("C:/Users/mroge/Documents/on.txt", on);
}else{
    if (File.Exists(@"C:/Users/mroge/Documents/on.txt")){
        File.Delete("C:/Users/mroge/Documents/on.txt");
        File.WriteAllText("C:/Users/mroge/Documents/off.txt", off);
    }else{
        File.Delete("C:/Users/mroge/Documents/off.txt");
        File.WriteAllText("C:/Users/mroge/Documents/on.txt", on);
    }
}