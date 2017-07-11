/**
 * Created by msalvi on 06/09/2016.
 */

// models
var models = require('../../models');
var Person = models.Person;
var Desk = models.Desk;
var MoveSet = models.MoveSet;
var MoveLine = models.MoveLine;
var MoveStatus = models.MoveStatus;

/**
 * get the current office of a person
 * based on the current MoveSet
 */
const getCurrentDeskName = (req,res) =>{
    models.sequelize.query('SELECT \"Desk\".name , \"Desk\".des_id '+
        'FROM \"Desk\" ' +
       'JOIN \"Person\" ON \"Desk\".person_id=\"Person\".per_id '+
        'WHERE \"Person\".firstname = :first AND \"Person\".lastname = :last;',
        { replacements: {first: req.params.first, last: req.params.last}, type: models.sequelize.QueryTypes.SELECT}
    ).then(function(desk){
            console.log(desk)
           res.json(desk);
        });
}

const getCurrentDeskNamebyId = (req,res) => {
    models.sequelize.query('SELECT \"Desk\".name , \"Desk\".des_id '+
        'FROM \"Desk\" ' +
        'JOIN \"Person\" ON \"Desk\".person_id=\"Person\".per_id '+
        'WHERE \"Person\".per_id = :id',
        { replacements: {id: req.params.id}, type: models.sequelize.QueryTypes.SELECT}
    ).then(function(desk){
            console.log(desk)
            res.json(desk);
        });
}

const saveMyLocalization = (req, res) => {      
    console.log('call of service to save my localization in DB');
    // debug
    console.log(req.body);
    if(req.body['desk-name'] === undefined || req.body['desk-name'] === null
    || req.body['desk-name'] === "" ){
        req.flash('error', 'Veuillez cliquer sur un bureau avant de valider.');
        res.redirect('/localization');
    }
    Person.findOne({
        where :{firstname : req.body.firstname,lastname : req.body.lastname}
    }).then(function(person_to_move){
        MoveStatus.findOne({where: {name: "Déplacement personnel"}})
        .then(function(status){
            var date = new Date();
            var set = MoveSet.build({
                name: "Nouvelle localisation pour " + req.body.firstname + " " + req.body.lastname + " " + date,
                creator: req.body.firstname + " " + req.body.lastname,
                status_id: status.sta_id,
                dateCreation: date,
                creator_id: person_to_move.per_id
            })
            set.save()
               .error(function (err) {
                    console.log(err + " ---------" + elem);
                })
                .then(function(moveset){
                    Desk.findOrCreate({
                        where: {
                            name: req.body['desk-name']
                        }}).spread(function(desk){
                        var today= new Date();
                        var desid = desk.des_id;
                        var setId = moveset.set_id;
                        // add all moveline from current configuration
                        models.sequelize.query(
                            'SELECT * FROM \"MoveSet\" ' +
                            'JOIN \"MoveStatus\" ON \"MoveSet\".status_id = \"MoveStatus\".sta_id ' +
                            'WHERE \"MoveStatus\".name = :statut'
                            , {replacements: {setid:setId, statut:"Validee"},type: models.sequelize.QueryTypes.SELECT
                            }).then(function (moveset) {
                                console.log(MoveSet);
                                MoveLine.findAll({
                                    where: {move_set_id: moveset[0].set_id}
                                }).then(function (moveline) {
                                        moveline.forEach(function(elem){
                                            // copy all the moveline from current configuration
                                            // except the one which is modified here
                                            if (elem.toDesk.toString() !== desid.toString() && elem.person_id.toString()!==person_to_move.per_id.toString()){
                                                MoveLine.create({
                                                    toDesk: elem.toDesk,
                                                    dateCreation : Date.now(),
                                                    status :"no change",
                                                    fromDesk: elem.toDesk,
                                                    person_id: elem.PersonPerId,
                                                    move_set_id: setId
                                                }).then(function (newMoveLine) {
    //                                                    console.log(elem.toDesk.toString() + "-------"+ offid.toString());
                                                });
                                            }
                                        });
                                        // insert new moving
                                        models.sequelize.query(' INSERT INTO \"MoveLine\"(\"dateCreation\",\"move_set_id\", \"person_id\", \"fromDesk\",\"toDesk\") ' +
                                            'VALUES(:today,:setId ,:perid, ' +
                                            'coalesce((SELECT \"toDesk\" FROM \"MoveLine\" WHERE person_id = :perid AND \"fromDesk\" is null), (SELECT \"Desk\".des_id FROM \"Desk\" WHERE \"Desk\".name = :namedesk) ) ' +
                                            ', :desId) ',
                                            { replacements: { today :today, setId: setId, perid : person_to_move.per_id, namedesk : "aucun", desId: desid }, type: models.sequelize.QueryTypes.INSERT}
                                        ).then(function(moveline){
                                                console.log(moveline)
                                            });
                                    });
                            });
                    });
                    })
                });
        });
   // Flash message + redirect
    req.flash('success', 'Votre changement de localisation a bien &eacutet&eacute transmis. Il doit maintenant etre valid&eacute par un manager');
    res.redirect('/');
};

const getLastDeskUpdate = (req,res) =>{
    models.sequelize.query('SELECT \"MoveLine\".\"dateCreation\" '+
        'FROM \"MoveLine\" '+
        'JOIN \"Person\" ON \"MoveLine\".person_id = \"Person\".per_id '+
        'WHERE \"Person\".per_id = :id ' +
        'ORDER BY \"MoveLine\".\"dateCreation\" desc ' +
        'LIMIT 1 ',
        { replacements: {id: req.params.id}, type: models.sequelize.QueryTypes.SELECT}
    ).then(function(updesk){
            console.log(updesk);
           res.json(updesk);
        });
}
const getPersonByDesk = (req,res) =>{
        models.sequelize.query('SELECT \"Person\".firstname,\"Person\".lastname '+
        'FROM \"Person\" '+
        'JOIN \"Desk\" ON \"Desk\".person_id = \"Person\".per_id '+
        'WHERE \"Desk\".name = :name ',
        { replacements: {name: req.params.name}, type: models.sequelize.QueryTypes.SELECT}
    ).then(function(person){
            console.log(person);
           res.json(person);
        });
}

/*const getLastDeskUpdate = (req,res) =>{
    models.sequelize.query('SELECT \"MoveLine\".\"dateCreation\" '+
        'FROM \"MoveLine\" M1 '+
        'WHERE NOT EXISTS ' +
            '(SELECT 1 ' +
            'FROM \"MoveLine\" M2 ' +
            'WHERE M2.mov_id = M1.mov_id ' +
            'AND M2.\"dateCreation\" > M2.\"dateCreation\" ',
        { replacements: {}, type: models.sequelize.QueryTypes.SELECT}
    ).then(function(updesk){
            console.log(updesk);
           res.json(updesk);
        });
}*/



module.exports = {
    saveMyLocalization,
    getCurrentDeskName,
    getCurrentDeskNamebyId,
    getLastDeskUpdate,
    getPersonByDesk
}