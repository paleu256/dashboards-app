import React from 'react';
import { shallow } from 'enzyme';
import ControlBar from 'd2-ui/lib/controlbar/ControlBar';
import TranslationDialog from 'd2-ui/lib/i18n/TranslationDialog.component';
import ConfirmDeleteDialog from '../ConfirmDeleteDialog';
import PrimaryButton from '../../widgets/PrimaryButton';
import FlatButton from '../../widgets/FlatButton';
import { EditBar } from '../EditBar';
import { getStubContext } from '../../../config/testsContext';

const mockDashboardModels = {
    rainbow: {
        id: 'rainbow123',
    },
};

jest.mock('../../api/dashboards', () => ({
    apiFetchSelected: id => Promise.resolve(mockDashboardModels[id]),
}));

describe('EditBar', () => {
    let props;
    let shallowEditBar;
    const editBar = () => {
        const context = getStubContext();

        if (!shallowEditBar) {
            shallowEditBar = shallow(<EditBar {...props} />, {
                context,
            });
        }
        return shallowEditBar;
    };

    const asyncExpectComponentExists = (Component, exists) => {
        const wrapper = editBar();

        return Promise.resolve()
            .then(() => {
                expect(wrapper.find(Component)).toHaveLength(0);
                wrapper.update();
            })
            .then(() => {
                expect(wrapper.find(Component)).toHaveLength(exists ? 1 : 0);
            });
    };

    beforeEach(() => {
        props = {
            style: {},
            onSave: undefined,
            onDiscard: undefined,
            dashboardId: undefined,
            deleteAccess: undefined,
        };
        shallowEditBar = undefined;
    });

    it('renders a ControlBar', () => {
        expect(editBar().find(ControlBar)).toHaveLength(1);
    });

    describe('when no dashboard id property', () => {
        beforeEach(() => {
            props.onSave = jest.fn();
            props.onDiscard = jest.fn();
        });

        it('renders Save button', () => {
            const saveBtn = editBar().find(PrimaryButton);
            expect(saveBtn).toHaveLength(1);
            expect(saveBtn.props().onClick).toBe(props.onSave);
        });

        it('renders Discard button', () => {
            const discardBtn = editBar().find(FlatButton);
            expect(discardBtn).toHaveLength(1);
            expect(discardBtn.props().onClick).toBe(props.onDiscard);
        });

        it('does not render a TranslationDialog', () => {
            return asyncExpectComponentExists(TranslationDialog, false);
        });

        it('does not render a ConfirmDeleteDialog', () => {
            return asyncExpectComponentExists(ConfirmDeleteDialog, false);
        });

        describe('when discard button clicked', () => {
            it('triggers the onDiscard function', () => {
                editBar()
                    .find(FlatButton)
                    .filterWhere(n => {
                        return n.childAt(0).text() === 'Exit without saving';
                    })
                    .simulate('click');

                expect(props.onDiscard).toHaveBeenCalled();
            });
        });
    });

    describe('when dashboard id property provided', () => {
        beforeEach(() => {
            props.dashboardId = 'rainbow';
        });

        it('renders a TranslationDialog', () => {
            return asyncExpectComponentExists(TranslationDialog, true);
        });

        it('does not render a ConfirmDeleteDialog', () => {
            return asyncExpectComponentExists(ConfirmDeleteDialog, false);
        });

        it('renders Translate and Discard buttons', () => {
            const secondaryBtns = editBar().find(FlatButton);
            expect(secondaryBtns).toHaveLength(2);
        });

        describe('when TRANSLATE button is clicked', () => {
            const getAsyncWrapper = () => {
                const wrapper = editBar();

                return Promise.resolve().then(() => {
                    wrapper.update();
                    return wrapper;
                });
            };

            it('shows the translate dialog', () => {
                getAsyncWrapper().then(wrapper => {
                    expect(
                        wrapper.find(TranslationDialog).prop('open')
                    ).toEqual(false);

                    wrapper
                        .find(FlatButton)
                        .filterWhere(n => {
                            return n.childAt(0).text() === 'Translate';
                        })
                        .simulate('click');

                    expect(
                        wrapper.find(TranslationDialog).prop('open')
                    ).toEqual(true);
                });
            });

            describe('when translations saved', () => {
                beforeEach(() => {
                    props.onTranslate = jest.fn();
                });

                it('triggers onTranslationsSaved', () => {
                    getAsyncWrapper()
                        .then(wrapper => {
                            wrapper
                                .find(TranslationDialog)
                                .simulate('translationSaved', [
                                    {
                                        locale: 'ponyLang',
                                        property: 'NAME',
                                        value: 'Regnbue',
                                    },
                                ]);
                        })
                        .then(() => {
                            expect(props.onTranslate).toHaveBeenCalled();
                        });
                });
            });
        });

        describe('when deleteAccess is true', () => {
            beforeEach(() => {
                props.deleteAccess = true;
                props.onDelete = jest.fn();
            });

            it('renders a ConfirmDeleteDialog', () => {
                expect(editBar().find(ConfirmDeleteDialog)).toHaveLength(1);
            });

            it('renders Translate, Delete, and Discard buttons', () => {
                const secondaryBtns = editBar().find(FlatButton);
                expect(secondaryBtns).toHaveLength(3);
            });

            it('shows the confirm delete dialog', () => {
                const wrapper = editBar();
                expect(wrapper.find(ConfirmDeleteDialog).prop('open')).toEqual(
                    false
                );

                wrapper
                    .find(FlatButton)
                    .filterWhere(n => {
                        return n.childAt(0).text() === 'Delete';
                    })
                    .simulate('click');

                expect(wrapper.find(ConfirmDeleteDialog).prop('open')).toEqual(
                    true
                );
                expect(props.onDelete).not.toHaveBeenCalled();
            });

            it('triggers onDelete when delete confirmed', () => {
                const dlg = editBar().find(ConfirmDeleteDialog);
                dlg.simulate('deleteConfirmed');

                expect(dlg.prop('open')).toEqual(false);
                expect(props.onDelete).toHaveBeenCalled();
            });

            it('does not trigger onDelete when delete not confirmed', () => {
                const dlg = editBar().find(ConfirmDeleteDialog);
                dlg.simulate('continueEditing');

                expect(dlg.prop('open')).toEqual(false);
                expect(props.onDelete).not.toHaveBeenCalled();
            });
        });
    });
});
