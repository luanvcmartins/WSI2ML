# WSI // ML

The WSI2ML is a straightforward annotation software for WSI files. It was built aiming to simplify the multidisciplinary effort required to create machine-learning datasets for pathology-related research. 

The software allows you to register users with different roles depending on their permissions, set up projects with images (by providing a folder) and annotation labels, and create and assign users to complete annotation tasks. Once your users have made enough annotations, they can be revised or exported to train ML models. Finally, the annotators can validate the model's annotation and improve the dataset if needed.  

For machine learning applications, the tool has the following workflow in mind:

 - Delegate annotation tasks for users (e.g., pathologists), where they will annotate the images in an easy-to-use user interface. The main goal is to allow non-computer-savvy people, such as pathologists, to easily understand and effectively use the software.

 - Delegate revision tasks for users (e.g., experienced pathologists), so that dubious annotations can be revised, filtered, or improved.

 - Export the annotations made in a non-opinionated way, allowing the ML specialists to deploy whatever tools, programming language, libraries, or techniques they require.

 - Allow the annotation experts to validate the models by allowing them to visualize the model's predictions and improve their annotations.

## Update 2
WSI2ML has been updated to version 2! This major update brings significant improvements to usability, performance, and functionality.

The web client has been completely rewritten with Vue3, resulting in a more intuitive user interface compared to the first version. We've also improved project organization, making it easier to navigate tasks and manage the datasets. Performance has also been improved, especially when loading multiple slides. The slide listing now displays a thumbnail preview for each image, streamlining the selection process.

A key feature of this update is the ability to open and annotate multiple slides simultaneously, allowing slides from the same patient to visualized at the same time. Revision tasks are now better integrated into the workflow and allow for easy visualization of colleague annotations without the need to define a specific revision task, with the same functionality applied to model predictions.

We've also implemented version control for datasets, allowing you to download previous generated versions whenever needed. Furthermore, you can now upload model annotations directly into the software for comparison and refinement -- previously this was done by the annotator out of the software.

Under the hood, we've transitioned the backend to MongoDB, replacing the previous SQLAlchemy and PostgreSQL setup for increased flexibility and simplicity. The docker usage has also been revamped: the docker is composed of three containers containing the backend, frontend, and a MongoDB server instance. 

## Docker
Docker images are available and are likely the easiest way to deploy and use the application. Just clone the repository or download its content, edit the `docker-compose.yml` file to your liking (you may want to mount your WSI directories), and then run `docker compose`.
```
git clone https://github.com/luanvcmartins/WSI2ML.git
docker compose up -d
```


### First use

Once you deploy the application, you will use the login information `admin` with the password `admin` to login into the system for the first time. We strongly advise you to change the password or delete the user after you complete the first setup process.

1. Go to the `management` section and create a new project: the project's name, WSI folder, and annotation labels will be required. The project's description is optional. 

2. Create a new user to delegate your tasks. The user's name, login and password must be provided. Additionally, users that require additional feature access may receive additional permissions. Annotators need no permissions. 

3. Create your first task: select the files for your task on the list and the users to annotate it. An optional task name can also be provided.

## Acknowledgments
This work was carried out at the Center for Artificial Intelligence (C4AI-USP), with support by the São Paulo Research Foundation (FAPESP grant #2019/07665-4 and #2020/15129-2) and by the IBM Corporation. 

## Citation 
```
@inproceedings{10.1145/3617023.3617038,
author = {Martins, Luan V. C. and Bueno, Adriana Passos and Defelicibus, Alexandre and Drummond, Rodrigo D. and Valieris, Renan and Zhu, Yu-Tao and Da Silva, Israel Tojal and Zhao, Liang},
title = {WSI2ML – An Open-Source Whole Slide Image Annotation Software for Machine Learning Applications},
year = {2023},
isbn = {9798400709081},
publisher = {Association for Computing Machinery},
address = {New York, NY, USA},
url = {https://doi.org/10.1145/3617023.3617038},
doi = {10.1145/3617023.3617038},
booktitle = {Proceedings of the 29th Brazilian Symposium on Multimedia and the Web},
pages = {104–109},
numpages = {6},
keywords = {whole slide image, image tagging, bioinformatics},
location = {Ribeir\~{a}o Preto, Brazil},
series = {WebMedia '23}
}
```